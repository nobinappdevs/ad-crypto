/**
 * Client-side auth state kept alongside the bearer token.
 *
 * The token alone cannot gate the dashboard: `/register` hands one out BEFORE the
 * email code is confirmed, since the verify call needs it. So the flags are
 * mirrored here and the guards read them without waiting on a request.
 *
 * The reset flow's token is the backend's, echoed back by each step, and lives in
 * `sessionStorage` — closing the tab should abandon it.
 *
 * Every access is guarded: this runs during prerender, and storage can throw.
 */

/** localStorage key for the bearer token (shared by the services + hooks). */
export const TOKEN_KEY = "adcrypto_token";

/**
 * localStorage mirrors of the verification flags, from the `/register` and `/login`
 * responses. These decide the gate on the first render — right after registering
 * they are the ONLY source that knows.
 *
 * `GET /user/dashboard` carries the same flags and overrides them once it answers
 * (see `accountGateState`), which is how an admin-panel change reaches a live tab.
 */
export const EMAIL_VERIFIED_KEY = "adcrypto_email_verified";
export const TWO_FA_KEY = "adcrypto_2fa";

/**
 * localStorage mirror of `data.email_verification` — the OPERATOR's switch, and the
 * one field no authenticated endpoint repeats. With it off there is no code and no
 * screen to send anyone to, whatever `email_verified` says.
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
 * A render-body read looks fine and then quietly stops: the values are written by a
 * mutation callback, and with the React Compiler on the read is memoized and never
 * runs again. So every write announces itself and the guards subscribe (see
 * `useAuthMirror`) — which also makes signing out in one tab reach the others.
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
 * `true`/`false` when this browser has been told, `null` when it has not. Both
 * guesses are wrong in their own direction, so `null` means "ask the server".
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
 * Two flags, read together: `two_factor_status` says whether an authenticator is
 * attached, `two_factor_verified` whether this session has answered. Collapsed to:
 *
 *   "off"     — not switched on; nothing to ask for.
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
 * `/register` puts the token at `data.token`, `/login` at `data.user_data.token`,
 * the forgot steps at `data.token`. One reader beats three call sites.
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
 * Two fields answering different questions — the operator's switch, and this
 * account's own flag. A code is owed only when the switch is on AND the flag is not 1:
 *
 *   {email_verification: true,  email_verified: 0} -> /verify-email
 *   {email_verification: true,  email_verified: 1} -> straight in
 *   {email_verification: false, …}                 -> straight in, nothing to ask
 *
 * The callers mirror the switch, since no authenticated endpoint repeats it.
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
 * The verification flags an authenticated payload carries. These are the account's
 * CURRENT state, unlike the mirrors above — an authenticator switched on elsewhere,
 * or an email confirmed in another tab, shows up here first.
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
 * Whether a live payload says the email address is confirmed. `null` when the field
 * is absent — that is "unknown", not "unverified". `email_verified_at` is
 * deliberately not consulted: it is null even on verified accounts.
 */
export function emailVerifiedFromFlags(flags: AccountFlags | undefined): boolean | null {
  const flag = flags?.email_verified;
  if (flag === undefined || flag === null) return null;
  return isOne(flag);
}

/**
 * The 2FA state a live payload describes. One direction only: `two_factor_status`
 * decides whether the question exists, and `two_factor_verified` is read only when
 * it does — an account with 2FA off can carry a 0 there forever.
 */
export function twoFaFromFlags(flags: AccountFlags | undefined): TwoFaState | null {
  const status = flags?.two_factor_status;
  if (status === undefined || status === null) return null;
  if (!isOne(status)) return "off";
  return isOne(flags?.two_factor_verified) ? "ok" : "pending";
}

/**
 * Collapses `two_factor_status` + `two_factor_verified` out of a login payload.
 * `null` when they are absent — "unknown", not "off", so callers keep what they knew.
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
   * False on the server and the first client paint. Not "signed out" — "not asked
   * yet", which the guards hold on rather than act on.
   */
  isClient: boolean;
  authed: boolean;
  emailVerified: boolean | null;
  twoFa: TwoFaState | null;
  /** The operator's switch; `false` means nobody is asked for a code at all. */
  verificationRequired: boolean | null;
};

/**
 * A STRING, deliberately: `useSyncExternalStore` compares snapshots by identity, so
 * a fresh object each call would re-render forever. `parseAuthMirror` unpacks it.
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
 * The one place that decides what an account still owes. BOTH guards call it, so
 * they cannot disagree and bounce a user between them.
 *
 * Three sources, in order of authority:
 *
 *   1. The operator's switch — `false` settles the email question outright, so an
 *      account marked 0 back when it was on is not stranded on a code screen.
 *   2. The live payload (`GET /user/dashboard`) — the account's state right now, so
 *      an admin edit or a second tab shows up here.
 *   3. The localStorage mirror — what makes the answer instant, and the only source
 *      that knows in the moment right after registering.
 *
 * `null` means "nobody has said", and the guards hold rather than guess. What it
 * must never read as is "cleared": that is how an unverified account walks in.
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
