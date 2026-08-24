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
 * localStorage mirrors of the two verification flags.
 *
 * NOT gates. Both guards decide from a live `GET /user/dashboard` on every entry —
 * a stored copy is only as true as the moment it was written, and an operator
 * flipping a flag in the admin panel writes to nobody's browser. What is left here
 * is a routing hint for the step immediately after a code is accepted, where the
 * response has just said what the state is and there is no reason to wait for
 * another request to act on it.
 */
export const EMAIL_VERIFIED_KEY = "adcrypto_email_verified";
export const TWO_FA_KEY = "adcrypto_2fa";

/** sessionStorage key for the reset token threaded through the forgot flow. */
export const RESET_TOKEN_KEY = "adcrypto_reset_token";

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
}

/* ── email verification ── */

export function setEmailVerified(verified: boolean) {
  try {
    window.localStorage.setItem(EMAIL_VERIFIED_KEY, verified ? "1" : "0");
  } catch {}
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
  } catch {}
  clearResetToken();
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
 * Whether the account still owes an email code.
 *
 * `user.email_verified` decides it, and nothing overrides it. That is the
 * account own state — the only thing that can say whether THIS address has
 * been confirmed — and it is present on every login and register response.
 *
 * `data.email_verification` is deliberately NOT trusted over it. Reading that
 * field first is what let a brand-new, unconfirmed account walk straight into the
 * dashboard: it is not the per-account answer, and a `false` there against an
 * `email_verified: 0` is not permission. It is consulted only when the payload
 * carries no per-account flag at all, where it is the one hint available.
 */
export function needsEmailVerification(res: unknown): boolean {
  const flag = extractUser(res)?.email_verified;
  if (flag !== undefined && flag !== null) return String(flag) !== "1";
  // No per-account flag at all: ask for the code unless the switch says the
  // feature is off. Defaulting to "ask" is the safe direction — a code that was
  // not needed can be skipped by verifying or resending, whereas skipping one that
  // WAS needed is an unverified account inside the dashboard.
  return (res as AuthPayload)?.data?.email_verification !== false;
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
