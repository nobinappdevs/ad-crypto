/**
 * The static half of the 2FA screen. The per-account half — secret, otpauth URI,
 * enrolment status — comes from `GET /user/profile/google-2fa`; see
 * `@/hooks/useSecurity`.
 */

/** Shown in the authenticator's own list, so it names the platform, not the page. */
export const TWO_FA_ISSUER = "AdCrypto";

/** The four `twoFa.steps.*` entries the setup card walks through. */
export const SETUP_STEPS = ["download", "scan", "code", "enable"] as const;

/** Where each app store button points. */
export const AUTHENTICATOR_APPS = {
  android: "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
  ios: "https://apps.apple.com/us/app/google-authenticator/id388497605",
};

/**
 * Builds an `otpauth://` URI from a bare secret.
 *
 * A FALLBACK only: the API sends `qr_text` already assembled, and that version is
 * better because it carries the account's real address as the label — an
 * authenticator holding two AdCrypto entries can only tell them apart by it.
 * This is what the QR falls back to when the response has the secret but no URI.
 */
export function otpauthUri(secret: string, account = TWO_FA_ISSUER) {
  const label = encodeURIComponent(`${TWO_FA_ISSUER}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer: TWO_FA_ISSUER,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Pulls `?secret=` back out of an `otpauth://` URI.
 *
 * Needed because of a quirk in the backend: on the FIRST call for an account it
 * generates the secret during the request and answers with `qr_secrete: null`
 * while `qr_text` already contains it — only from the second call on do both
 * arrive. Without this the setup screen shows an empty "secret key" box on the one
 * visit that matters, the first, and the enable button has nothing to work from.
 */
export function secretFromOtpauthUri(uri: string | undefined): string {
  if (!uri) return "";
  const match = /[?&]secret=([^&]+)/i.exec(uri);
  return match ? decodeURIComponent(match[1]) : "";
}

/** `ABCD EFGH IJKL` — a long secret is unreadable as one run of glyphs. */
export function groupSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}
