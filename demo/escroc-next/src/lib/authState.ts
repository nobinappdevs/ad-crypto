/**
 * Client-side auth state kept alongside the bearer token.
 *
 * The token alone can't gate the dashboard: register/login hand out a working
 * token *before* the email OTP step (the verify call itself needs auth), so
 * "has a token" and "is allowed in" are two different questions. We mirror
 * `user.email_verified` here so the guards can answer the second one without
 * waiting on a request — `AuthGuard` still re-checks it against `/user/profile`,
 * which is the only answer a user can't edit from devtools.
 */

/** localStorage key for the bearer token (shared by the services + hooks). */
export const TOKEN_KEY = "escroc_token";

/** localStorage mirror of `user.email_verified` ("1" | "0"). */
export const EMAIL_VERIFIED_KEY = "escroc_email_verified";

/** localStorage mirror of the account's Google-2FA state (see `TwoFaState`). */
export const TWO_FA_KEY = "escroc_2fa";

/** sessionStorage key telling the OTP screen which flow it is serving. */
export const OTP_FLOW_KEY = "escroc_otp_flow";

/** Which screen sent the user to the OTP page — decides its way back out. */
export const OTP_ORIGIN_KEY = "escroc_otp_origin";

/** The address the code was mailed to, so the OTP screen can show it. */
export const OTP_EMAIL_KEY = "escroc_otp_email";

export type OtpOrigin = "register" | "login";

export function setEmailVerified(verified: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_VERIFIED_KEY, verified ? "1" : "0");
}

/**
 * `true` / `false` when we know, `null` when we don't — a session that predates
 * this flag has no entry, and guessing either way is wrong (guess "verified"
 * and the hole stays open; guess "unverified" and we bounce people who are
 * fine). Callers treat `null` as "ask the server".
 */
export function readEmailVerified(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(EMAIL_VERIFIED_KEY);
  if (raw === null) return null;
  return raw === "1";
}

/* ── Google 2FA ──
 *
 * Two flags decide this, and only together: `two_factor_status` says whether the
 * account has an authenticator attached at all, `two_factor_verified` says
 * whether this session has answered its code. We collapse them into one value:
 *
 *   "off"     — 2FA isn't switched on; nothing to ask for.
 *   "ok"      — switched on and already answered.
 *   "pending" — switched on and still owed a code; the dashboard stays shut.
 */
export type TwoFaState = "off" | "ok" | "pending";

export function setTwoFaState(state: TwoFaState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TWO_FA_KEY, state);
}

/** `null` when this browser has no answer yet — callers ask the server instead. */
export function readTwoFaState(): TwoFaState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TWO_FA_KEY);
  return raw === "off" || raw === "ok" || raw === "pending" ? raw : null;
}

/**
 * Collapses `data.user.two_factor_status` + `two_factor_verified` out of a
 * login/profile payload. `null` when the response doesn't carry the flags at
 * all — that's "unknown", not "off", so callers keep whatever they already knew.
 */
export function twoFaStateFromResponse(res: unknown): TwoFaState | null {
  const user = (res as {
    data?: { user?: { two_factor_status?: number | string; two_factor_verified?: number | string } };
  })?.data?.user;
  const status = user?.two_factor_status;
  if (status === undefined || status === null) return null;
  if (String(status) !== "1") return "off";
  return String(user?.two_factor_verified) === "1" ? "ok" : "pending";
}

/**
 * Point the OTP screen at the email-verification flow (vs. password reset).
 * `origin` and `email` are what let that screen offer a way back — without them
 * a typo in the signup email is a dead end.
 */
export function startEmailOtpFlow(origin: OtpOrigin = "login", email?: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OTP_FLOW_KEY, "email");
  window.sessionStorage.setItem(OTP_ORIGIN_KEY, origin);
  if (email) window.sessionStorage.setItem(OTP_EMAIL_KEY, email);
}

export function setOtpEmail(email: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OTP_EMAIL_KEY, email);
}

export function readOtpOrigin(): OtpOrigin {
  if (typeof window === "undefined") return "login";
  return window.sessionStorage.getItem(OTP_ORIGIN_KEY) === "register" ? "register" : "login";
}

export function readOtpEmail(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(OTP_EMAIL_KEY) ?? "";
}

export function clearOtpFlow() {
  if (typeof window === "undefined") return;
  [OTP_FLOW_KEY, OTP_ORIGIN_KEY, OTP_EMAIL_KEY].forEach((k) => window.sessionStorage.removeItem(k));
}

/** Wipe everything that makes this browser look logged in. */
export function clearAuthState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EMAIL_VERIFIED_KEY);
  window.localStorage.removeItem(TWO_FA_KEY);
  clearOtpFlow();
}

/** Reads `data.user.email_verified` out of a login/register/profile payload. */
export function emailVerifiedFromResponse(res: unknown): boolean | null {
  const flag = (res as { data?: { user?: { email_verified?: number | string } } })?.data?.user
    ?.email_verified;
  if (flag === undefined || flag === null) return null;
  return String(flag) === "1";
}
