const KEY = "adcrypto_pending_email";

/**
 * The address a just-registered account has to confirm, carried from `/register`
 * to `/verify-email`.
 *
 * `sessionStorage` rather than a `?email=` query param: the address would sit in
 * the URL, in history and in any shared link, and a static export would need the
 * verify page wrapped in Suspense just to read it. Session scope is also exactly
 * the lifetime wanted — closing the tab abandons the flow.
 *
 * Every access is guarded: this runs during prerender too, where there is no
 * `window`, and a browser with storage blocked throws on the property itself.
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
