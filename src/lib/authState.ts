/**
 * Client-side auth state kept alongside the bearer token.
 *
 * The token alone can't gate the dashboard: `POST /register` hands out a working
 * token *before* the email code is confirmed (the verify call itself needs that
 * token to authenticate), so "has a token" and "is allowed in" are two different
 * questions. `user.email_verified` is mirrored here so the guards can answer the
 * second one without waiting on a request.
 *
 * The password-reset flow has no token of its own — the backend issues a
 * short-lived one from `POST /password/forgot/find/user` and every later step
 * (resend, verify, reset) has to echo it back. That lives in `sessionStorage`,
 * because abandoning the flow by closing the tab is the right outcome.
 *
 * Every access is guarded: this runs during prerender too, where there is no
 * `window`, and a browser with storage blocked throws on the property itself.
 */

/** localStorage key for the bearer token (shared by the services + hooks). */
export const TOKEN_KEY = "adcrypto_token";

/**
 * localStorage mirrors of the verification flags, written from the `/register`
 * and `/login` responses.
 *
 * These are what the guards decide on the instant a screen mounts, before any
 * request has answered — and for the step right after registering, they are the
 * ONLY thing that knows: the account was created a moment ago and the response
 * that created it is the only place the answer has appeared so far.
 *
 * `GET /user/dashboard` carries the same flags and overrides them whenever it
 * answers (see `accountGateState`), which is what makes an operator's change in
 * the admin panel reach a tab nobody reloaded. Mirror first, server on top — not
 * one or the other.
 */
export const EMAIL_VERIFIED_KEY = "adcrypto_email_verified";
export const TWO_FA_KEY = "adcrypto_2fa";

/**
 * localStorage mirror of `data.email_verification` — the OPERATOR's switch, not
 * an account's state, and the one field no authenticated endpoint repeats.
 *
 * It only ever arrives on a register or login response, so it is kept here for
 * the guards to consult afterwards. With the switch off there is no code, no
 * mail and no screen to send anyone to, whatever `email_verified` happens to say
 * on an account created back when it was on.
 */
export const EMAIL_VERIFICATION_KEY = "adcrypto_email_verification";

/** sessionStorage key for the reset token threaded through the forgot flow. */
export const RESET_TOKEN_KEY = "adcrypto_reset_token";

/* -------------------------------------------------------------------------- */
/* Change notification                                                         */
/* -------------------------------------------------------------------------- */

/**
 * localStorage is not reactive, and the guards have to be.
 *
 * Reading it straight out of a render body looks like it works and then quietly
 * stops: the values are written by a mutation callback, which is not a render, so
 * nothing tells React that the answer changed — and with the React Compiler on,
 * a read whose inputs haven't changed is memoized and never runs again. That is a
 * guard holding an answer from before the user signed in.
 *
 * So every write announces itself and the guards subscribe (see `useAuthMirror`),
 * which is also what makes signing out in one tab reach the others.
 */
const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

/** `useSyncExternalStore`'s subscribe: local writes and other tabs both count. */
export function subscribeAuthState(listener: () => void): () => void {
  listeners.add(listener);
  try {
    window.addEventListener("storage", listener);
  } catch {}
  return () => {
    listeners.delete(listener);
    try {
      window.removeEventListener("storage", listener);
    } catch {}
  };
}

/* ── bearer token ── */

export function readToken(): string {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {}
  announce();
}

/* ── email verification ── */

export function setEmailVerified(verified: boolean) {
  try {
    window.localStorage.setItem(EMAIL_VERIFIED_KEY, verified ? "1" : "0");
  } catch {}
  announce();
}

/**
 * `true` / `false` when this browser has been told, `null` when it has not — a
 * session that predates the flag has no entry, and guessing either way is wrong:
 * guess "verified" and the gate stands open, guess "unverified" and a perfectly
 * fine account is bounced to a code screen. `null` means "ask the server".
 */
export function readEmailVerified(): boolean | null {
  try {
    const raw = window.localStorage.getItem(EMAIL_VERIFIED_KEY);
    return raw === null ? null : raw === "1";
  } catch {
    return null;
  }
}

/** Mirrors `data.email_verification` from the last register/login response. */
export function setEmailVerificationRequired(required: boolean) {
  try {
    window.localStorage.setItem(EMAIL_VERIFICATION_KEY, required ? "1" : "0");
  } catch {}
  announce();
}

/** `false` only when a response has actually said the switch is off. */
export function readEmailVerificationRequired(): boolean | null {
  try {
    const raw = window.localStorage.getItem(EMAIL_VERIFICATION_KEY);
    return raw === null ? null : raw === "1";
  } catch {
    return null;
  }
}

/* ── Google 2FA ──
 *
 * Two flags decide this, and only together: `two_factor_status` says whether the
 * account has an authenticator attached at all, `two_factor_verified` says
 * whether this session has answered its code. Collapsed into one value:
 *
 *   "off"     — 2FA isn't switched on; nothing to ask for.
 *   "ok"      — switched on and already answered.
 *   "pending" — switched on and still owed a code; the dashboard stays shut.
 */
export type TwoFaState = "off" | "ok" | "pending";

export function setTwoFaState(state: TwoFaState) {
  try {
    window.localStorage.setItem(TWO_FA_KEY, state);
  } catch {}
  announce();
}

/** `null` when this browser has no answer yet — callers ask the server instead. */
export function readTwoFaState(): TwoFaState | null {
  try {
    const raw = window.localStorage.getItem(TWO_FA_KEY);
    return raw === "off" || raw === "ok" || raw === "pending" ? raw : null;
  } catch {
    return null;
  }
}

/* ── password-reset token ── */

export function setResetToken(token: string) {
  try {
    window.sessionStorage.setItem(RESET_TOKEN_KEY, token);
  } catch {}
}

export function readResetToken(): string {
  try {
    return window.sessionStorage.getItem(RESET_TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearResetToken() {
  try {
    window.sessionStorage.removeItem(RESET_TOKEN_KEY);
  } catch {}
}

/* ── teardown ── */

/** Wipe everything that makes this browser look signed in. */
export function clearAuthState() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(EMAIL_VERIFIED_KEY);
    window.localStorage.removeItem(TWO_FA_KEY);
    window.localStorage.removeItem(EMAIL_VERIFICATION_KEY);
  } catch {}
  clearResetToken();
  announce();
}

/* -------------------------------------------------------------------------- */
/* Response readers                                                            */
/* -------------------------------------------------------------------------- */

type AuthUser = {
  email_verified?: number | string;
  two_factor_status?: number | string;
  two_factor_verified?: number | string;
};

type AuthPayload = {
  token?: string;
  data?: {
    token?: string;
    email_verification?: boolean;
    kyc_verification?: boolean;
    user?: AuthUser;
    /** Login nests one level deeper than register — see `extractToken`. */
    user_data?: { token?: string; user?: AuthUser };
  };
};

/**
 * `/register` returns the token at `data.token`, `/login` at
 * `data.user_data.token`, and the forgot-flow steps at `data.token` again. One
 * reader for all of them beats three call sites each reaching into its own spot.
 */
export function extractToken(res: unknown): string | undefined {
  const r = res as AuthPayload;
  return r?.data?.user_data?.token ?? r?.data?.token ?? r?.token;
}

/** The `user` object, wherever this particular endpoint chose to put it. */
export function extractUser(res: unknown): AuthUser | undefined {
  const r = res as AuthPayload;
  return r?.data?.user_data?.user ?? r?.data?.user;
}

/**
 * Whether the account still owes an email code, from a login or register payload.
 *
 * Two fields, and they answer different questions. `data.email_verification` is
 * the operator's switch — whether anybody is asked for a code at all.
 * `user.email_verified` is this account's own state. A code is owed only when the
 * switch is on AND the account's flag is not 1:
 *
 *   {email_verification: true,  email_verified: 0} -> /verify-email
 *   {email_verification: true,  email_verified: 1} -> straight in
 *   {email_verification: false, …}                 -> straight in, nothing to ask
 *
 * The switch is mirrored to localStorage by the callers, because no authenticated
 * endpoint repeats it and the guards have to apply the same veto later.
 */
export function needsEmailVerification(res: unknown): boolean {
  // The switch first, and only as a VETO. `false` means the operator has the
  // feature off, so there is no code for anyone to enter and no screen to send
  // them to — whatever the account's own column happens to say.
  const switchOn = (res as AuthPayload)?.data?.email_verification;
  if (switchOn === false) return false;

  // Switched on: the account's flag is what is left to decide, and a 0 against a
  // `true` switch is the case this exists for — a fresh registration with a code
  // in the user's inbox.
  const flag = extractUser(res)?.email_verified;
  if (flag !== undefined && flag !== null) return String(flag) !== "1";

  // Neither a flag nor a switch: nothing has claimed a code is owed.
  return switchOn === true;
}

/**
 * `data.email_verification` out of a register/login payload — the operator's
 * switch, `undefined` when this response didn't carry it.
 */
export function emailVerificationFromResponse(res: unknown): boolean | undefined {
  const value = (res as AuthPayload)?.data?.email_verification;
  return typeof value === "boolean" ? value : undefined;
}

/* -------------------------------------------------------------------------- */
/* Live payloads                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The verification flags an authenticated payload carries — the dashboard's, and
 * the profile's where that endpoint includes them.
 *
 * These are the account's CURRENT state, unlike the mirrors above, which are
 * whatever login last wrote. An authenticator switched on from another device, or
 * an email confirmed in another tab, shows up here first.
 */
export type AccountFlags = {
  email_verified?: number | string | null;
  /**
   * Deliberately unused. It is null on accounts whose `email_verified` is 1, so
   * reading it as the flag would bounce verified users to the verify screen.
   */
  email_verified_at?: string | null;
  two_factor_status?: number | string | null;
  two_factor_verified?: number | string | null;
};

const isOne = (value: number | string | null | undefined) => String(value) === "1";

/**
 * Whether a live payload says the email address is confirmed.
 *
 * `null` when the payload does not carry the field — that is "unknown", not
 * "unverified": deciding a gate on a field an endpoint simply does not send would
 * be our bug, not the user's. Note that `email_verified_at` is deliberately not
 * consulted; it is null on accounts whose `email_verified` is 1.
 */
export function emailVerifiedFromFlags(flags: AccountFlags | undefined): boolean | null {
  const flag = flags?.email_verified;
  if (flag === undefined || flag === null) return null;
  return isOne(flag);
}

/**
 * The 2FA state a live payload describes.
 *
 * The pair is read in one direction only: `two_factor_status` decides whether the
 * question exists at all, and `two_factor_verified` is consulted ONLY when it
 * does. An account with 2FA switched off can carry `two_factor_verified: 0`
 * forever — that is not a debt, it is a field nobody asked about.
 */
export function twoFaFromFlags(flags: AccountFlags | undefined): TwoFaState | null {
  const status = flags?.two_factor_status;
  if (status === undefined || status === null) return null;
  if (!isOne(status)) return "off";
  return isOne(flags?.two_factor_verified) ? "ok" : "pending";
}

/**
 * Collapses `two_factor_status` + `two_factor_verified` out of a login payload.
 *
 * `null` when the response doesn't carry the flags at all — that's "unknown", not
 * "off", so callers keep whatever they already knew rather than quietly
 * downgrading a session that was waiting on a code.
 */
export function twoFaStateFromResponse(res: unknown): TwoFaState | null {
  const user = extractUser(res);
  const status = user?.two_factor_status;
  if (status === undefined || status === null) return null;
  if (String(status) !== "1") return "off";
  return String(user?.two_factor_verified) === "1" ? "ok" : "pending";
}

/* -------------------------------------------------------------------------- */
/* The stored snapshot                                                         */
/* -------------------------------------------------------------------------- */

/** Everything this browser has been told about the session, as one value. */
export type AuthMirror = {
  /**
   * False on the server and on the first client paint, where there is no storage
   * to read. It is not "signed out" — it is "not asked yet", and the guards hold
   * rather than act on it.
   */
  isClient: boolean;
  authed: boolean;
  emailVerified: boolean | null;
  twoFa: TwoFaState | null;
  /** The operator's switch; `false` means nobody is asked for a code at all. */
  verificationRequired: boolean | null;
};

/**
 * A STRING, deliberately.
 *
 * `useSyncExternalStore` compares snapshots by identity and re-renders forever if
 * a fresh object comes back each call, so the store's value has to be a primitive.
 * The guards get the object back from `parseAuthMirror`, past that comparison.
 */
export function authStateSnapshot(): string {
  const flag = (value: boolean | null) => (value === null ? "-" : value ? "1" : "0");
  return [
    readToken() ? "1" : "0",
    flag(readEmailVerified()),
    readTwoFaState() ?? "-",
    flag(readEmailVerificationRequired()),
  ].join("|");
}

/** The server has no storage; the empty string is a snapshot no client produces. */
export function authStateServerSnapshot(): string {
  return "";
}

export function parseAuthMirror(snapshot: string): AuthMirror {
  if (!snapshot) {
    return {
      isClient: false,
      authed: false,
      emailVerified: null,
      twoFa: null,
      verificationRequired: null,
    };
  }
  const [token, email, twoFa, verification] = snapshot.split("|");
  const flag = (value: string) => (value === "-" ? null : value === "1");
  return {
    isClient: true,
    authed: token === "1",
    emailVerified: flag(email),
    twoFa: twoFa === "off" || twoFa === "ok" || twoFa === "pending" ? twoFa : null,
    verificationRequired: flag(verification),
  };
}

/* -------------------------------------------------------------------------- */
/* The gate itself                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The one place that decides what an account still owes. BOTH guards call this,
 * so `/dashboard` and the signed-out screens can never disagree about it and
 * bounce a user between them.
 *
 * Three sources, in this order of authority:
 *
 *   1. The operator's switch (mirrored from the last register/login response).
 *      `false` settles the email question outright — verification is off, so no
 *      code exists, no mail was sent, and `email_verified: 0` on an account made
 *      back when it was on is a leftover column, not a debt. This is the case that
 *      used to strand people on a code screen nothing could ever satisfy.
 *   2. The live payload — `GET /user/dashboard` carries all three flags. It is the
 *      account's state right now, so an operator's edit or a second tab shows up
 *      here, and it overrides the mirror whenever it has actually answered.
 *   3. The localStorage mirror, written from the register/login response. It is
 *      what makes the decision instant, and immediately after registering it is
 *      the ONLY source that knows: the request in (2) is still in flight, and
 *      until it lands the response that created the account is all there is.
 *
 * `null` is a real answer here and means "nobody has said" — the guards hold
 * rather than guess, because both guesses are wrong in a different direction.
 * What it must never do is silently read as "cleared": an absent field is an
 * endpoint not answering the question, and treating that as permission is exactly
 * how an unverified account walked into the dashboard.
 */
export function accountGateState(
  live: AccountFlags | undefined,
  mirror: AuthMirror,
): { emailVerified: boolean | null; twoFa: TwoFaState | null } {
  if (!mirror.isClient) return { emailVerified: null, twoFa: null };

  return {
    emailVerified:
      mirror.verificationRequired === false
        ? true
        : (emailVerifiedFromFlags(live) ?? mirror.emailVerified),
    twoFa: twoFaFromFlags(live) ?? mirror.twoFa,
  };
}
