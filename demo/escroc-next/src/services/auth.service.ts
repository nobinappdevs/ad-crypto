import { publicApi, privateApi, TOKEN_KEY } from "@/lib/axios";
import {
  loginRequestSchema,
  loginResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from "@/schemas/auth.schema";

/* ── payload types (mirror the Laravel field names) ── */
export interface RegisterPayload {
  type: "buyer" | "seller";
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  policy?: "on";
}

export interface VerifyForgotOtpPayload {
  otp: string;
  token: string;
}

export interface ResetPasswordPayload {
  password: string;
  password_confirmation: string;
  token: string;
}

export const authService = {
  /** POST /user/login — public. Request + response validated with Zod. */
  async login(payload: LoginRequest & { recaptchaToken?: string }): Promise<LoginResponse> {
    const body = loginRequestSchema.parse(payload);
    // Attach the Google reCAPTCHA token only when present (feature is optional).
    const res = await publicApi.post("/user/login", {
      ...body,
      ...(payload.recaptchaToken ? { "g-recaptcha-response": payload.recaptchaToken } : {}),
    });
    return loginResponseSchema.parse(res.data);
  },

  /** POST /user/register — public. */
  async register(payload: RegisterPayload & { recaptchaToken?: string }) {
    const { recaptchaToken, ...rest } = payload;
    const res = await publicApi.post("/user/register", {
      policy: "on",
      ...rest,
      ...(recaptchaToken ? { "g-recaptcha-response": recaptchaToken } : {}),
    });
    return res.data;
  },

  /* ── Forgot-password flow (public) ── */

  /** POST /user/forgot/password/send/otp */
  async forgotSendOtp(credentials: string) {
    const res = await publicApi.post("/user/forgot/password/send/otp", { credentials });
    return res.data;
  },

  /** POST /user/forgot/password/verify */
  async forgotVerifyOtp(payload: VerifyForgotOtpPayload) {
    const res = await publicApi.post("/user/forgot/password/verify", payload);
    return res.data;
  },

  /** POST /user/forgot/password/reset */
  async resetPassword(payload: ResetPasswordPayload) {
    const res = await publicApi.post("/user/forgot/password/reset", payload);
    return res.data;
  },

  /* ── Email verification (authed — uses the signup token) ── */

  /** POST /user/email/otp/verify */
  async verifyEmailOtp(otp: string) {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) ?? "" : "";
    const res = await privateApi.post("/user/email/otp/verify", { otp, token });
    return res.data;
  },

  /**
   * POST /user/verify/google-2fa — the 6-digit authenticator code.
   *
   * Sent as form-data (`otp`), matching the other verify endpoints. Succeeds
   * only while the session still owes a code; the backend flips
   * `two_factor_verified` to 1 on the way out.
   */
  async verifyGoogle2fa(otp: string) {
    const form = new FormData();
    form.append("otp", otp);
    const res = await privateApi.post("/user/verify/google-2fa", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/email/resend/code */
  async resendEmailCode() {
    const res = await privateApi.post("/user/email/resend/code");
    return res.data;
  },

  /* ── Session ── */

  /** GET /user/profile — requires auth. */
  async getProfile() {
    const res = await privateApi.get("/user/profile");
    return res.data;
  },

  /** GET /user/logout — requires auth. Drops the local token afterwards. */
  async logout(): Promise<void> {
    try {
      await privateApi.get("/user/logout");
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    }
  },
};

export default authService;
