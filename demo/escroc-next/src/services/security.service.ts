import { privateApi } from "@/lib/axios";

export interface Google2faData {
  qr_code: string;
  qr_secrete: string;
  qr_status: number; // 1 = enabled
  alert: string;
}

export const securityService = {
  /** GET /user/profile/google-2fa/ — QR, secret, and current status. */
  async getGoogle2fa(lang = "en"): Promise<{ data: Google2faData }> {
    const res = await privateApi.get(`/user/profile/google-2fa?lang=${lang}`);
    return res.data;
  },

  /** POST /user/profile/google-2fa/status/update — enable (1) / disable (0); requires the 6-digit code. */
  async updateStatus(status: number, code: string) {
    const form = new FormData();
    form.append("status", String(status));
    form.append("code", code);
    const res = await privateApi.post("/user/profile/google-2fa/status/update", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default securityService;
