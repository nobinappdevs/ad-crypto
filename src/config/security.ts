import { DEMO_USER } from "@/config/account";

/**
 * The account's 2FA enrolment, as demo data.
 *
 * Stands in for the endpoint that would issue this pair per user, so it is shaped
 * like that response rather than like markup: the shared secret, and the status
 * the page opens on. The QR is NOT part of it — a code image from a server is one
 * more thing to load and to trust, when the only input it encodes is the secret
 * already sitting here. The page renders it locally from `otpauthUri` instead.
 */
export const TWO_FA = {
  /**
   * Base32, as every authenticator app expects — the alphabet excludes 0/1/8/9 so
   * a hand-typed secret cannot confuse O for 0 or I for 1.
   */
  secret: "K5CTQNJXGE3TQMBRHBCTOMRWGI2S6NBW",
  /** Shown in the app's own list, so it has to name the platform, not the page. */
  issuer: "AdCrypto",
  account: DEMO_USER.email,
  /** 0 = not enrolled, 1 = enrolled. Mirrors the API's own flag. */
  status: 0,
};

/** The four `twoFa.steps.*` entries the setup card walks through. */
export const SETUP_STEPS = ["download", "scan", "code", "enable"] as const;

/** Where each app store button points. */
export const AUTHENTICATOR_APPS = {
  android:
    "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
  ios: "https://apps.apple.com/us/app/google-authenticator/id388497605",
};

/**
 * The `otpauth://` URI an authenticator app reads out of the QR.
 *
 * Both label and issuer are sent: the label is what the app lists the entry under,
 * and the separate `issuer` parameter is what lets it group and de-duplicate
 * entries when the same address is enrolled with more than one service.
 */
export function otpauthUri({
  secret = TWO_FA.secret,
  issuer = TWO_FA.issuer,
  account = TWO_FA.account,
}: { secret?: string; issuer?: string; account?: string } = {}) {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: "6", period: "30" });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** `ABCD EFGH IJKL` — a 32-character secret is unreadable as one run of glyphs. */
export function groupSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}
