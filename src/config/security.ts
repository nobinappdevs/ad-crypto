/**
 * The static half of the 2FA screen. The per-account half comes from
 * `GET /user/profile/google-2fa`; see `@/hooks/useSecurity`.
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
 * Builds an `otpauth://` URI from a bare secret — a FALLBACK only. The API's own
 * `qr_text` is better: it carries the account's address as the label, which is how
 * an authenticator holding two AdCrypto entries tells them apart.
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
 * Needed for a backend quirk: on the FIRST call for an account, `qr_secrete` is null
 * while `qr_text` already carries the secret. Without this the setup screen shows an
 * empty secret box on the one visit that matters.
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
