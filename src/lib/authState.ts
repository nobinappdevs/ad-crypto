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

/** localStorage mirror of `user.email_verified` ("1" | "0"). */
export const EMAIL_VERIFIED_KEY = "adcrypto_email_verified";

/** localStorage mirror of the account's Google-2FA state (see `TwoFaState`). */
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

/**
 * `true` / `false` when we know, `null` when we don't — a session that predates
 * this flag has no entry, and guessing either way is wrong: guess "verified" and
 * the hole stays open, guess "unverified" and we bounce people who are fine. The
 * guards treat `null` as "let them through"; the API is the real gate.
 */
export function readEmailVerified(): boolean | null {
  try {
    const raw = window.localStorage.getItem(EMAIL_VERIFIED_KEY);
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
 * Two independent things decide it. `data.email_verification` is the site-wide
 * switch — `false` means the feature is off and there is no code to enter, for
 * anyone. `user.email_verified` is this account's own flag. The switch wins when
 * it says "off"; otherwise the per-user flag does.
 */
export function needsEmailVerification(res: unknown): boolean {
  const r = res as AuthPayload;
  if (r?.data?.email_verification === false) return false;
  const flag = extractUser(res)?.email_verified;
  if (flag === undefined || flag === null) return r?.data?.email_verification === true;
  return String(flag) !== "1";
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
