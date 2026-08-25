const KEY = "adcrypto_pending_email";

/**
 * The address a just-registered account has to confirm, carried from `/register` to
 * `/verify-email`.
 *
 * `sessionStorage` rather than a `?email=` param: the address would sit in the URL
 * and in history, and session scope is exactly the lifetime wanted. Every access is
 * guarded — this runs during prerender, and storage can throw.
 */
export function setPendingEmail(email: string) {
  try {
    window.sessionStorage.setItem(KEY, email);
  } catch {}
}

export function getPendingEmail(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearPendingEmail() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {}
}
