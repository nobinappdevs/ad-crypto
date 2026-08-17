import { privateApi } from "@/lib/axios";

/** `GET /user/profile/google-2fa` — everything the setup screen needs. */
export interface Google2faData {
  /**
   * A rendered QR as raw SVG markup. Deliberately unused: injecting server HTML
   * needs `dangerouslySetInnerHTML`, and it arrives with a hard-coded white
   * background that fights the dark theme. `qr_text` carries the same payload as
   * data, so the page draws its own.
   */
  qr_code?: string;
  /** The shared secret, base32, for authenticators that are typed into. */
  qr_secrete?: string;
  /** The full `otpauth://totp/...` URI — what the QR should encode. */
  qr_text?: string;
  /** 0 = not enrolled, 1 = enrolled. */
  qr_status?: number;
  /** The backend's own note about adding the account to an authenticator. */
  alert?: string;
}

export const securityService = {
  /** GET /user/profile/google-2fa — secret, otpauth URI, and current status. */
  async getGoogle2fa(): Promise<{ data?: Google2faData }> {
    const res = await privateApi.get("/user/profile/google-2fa");
    return res.data;
  },

  /**
   * POST /user/profile/google-2fa/status/update — enable (1) or disable (0).
   *
   * `code` is required in BOTH directions (a missing one is a 422): enabling
   * against an authenticator that was never actually enrolled would lock the
   * account out, and disabling without proof would be a takeover.
   */
  async updateGoogle2faStatus(status: 0 | 1, code: string) {
    const form = new FormData();
    form.append("status", String(status));
    form.append("code", code);
    const res = await privateApi.post("/user/profile/google-2fa/status/update", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * POST /user/google-2fa/otp/verify — the login-time gate.
   *
   * Note the path: this one hangs off `/user`, not `/user/profile`, because it
   * belongs to signing in rather than to managing the setting.
   */
  async verifyGoogle2faOtp(otp: string) {
    const form = new FormData();
    form.append("otp", otp);
    const res = await privateApi.post("/user/google-2fa/otp/verify", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default securityService;
