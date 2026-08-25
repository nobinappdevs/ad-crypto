import { privateApi } from "@/lib/axios";

/** `GET /user/profile/google-2fa` — everything the setup screen needs. */
export interface Google2faData {
  /**
   * A rendered QR as raw SVG. Unused: it needs `dangerouslySetInnerHTML` and carries
   * a hard-coded white background. `qr_text` has the same payload as data.
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
   * POST /user/profile/google-2fa/status/update — enable (1) or disable (0). `code` is
   * required in BOTH directions: enabling without a real enrolment locks the account
   * out, disabling without proof is a takeover.
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
   * POST /user/google-2fa/otp/verify — the login-time gate. Note the path: `/user`,
   * not `/user/profile`, because it belongs to signing in.
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
