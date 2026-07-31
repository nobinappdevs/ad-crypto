import { publicApi } from "@/lib/axios";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/schemas/auth.schema";

export const authService = {
  /** POST /user/login - public. Backend not connected yet; endpoint is a placeholder. */
  async login(payload: LoginRequest) {
    const res = await publicApi.post("/user/login", payload);
    return res.data;
  },

  /** POST /user/forgot-password - public. Backend not connected yet; endpoint is a placeholder. */
  async forgotPassword(payload: ForgotPasswordRequest) {
    const res = await publicApi.post("/user/forgot-password", payload);
    return res.data;
  },

  /** POST /user/verify-otp - public. Backend not connected yet; endpoint is a placeholder. */
  async verifyOtp(payload: VerifyOtpRequest) {
    const res = await publicApi.post("/user/verify-otp", payload);
    return res.data;
  },

  /** POST /user/reset-password - public. Backend not connected yet; endpoint is a placeholder. */
  async resetPassword(payload: Omit<ResetPasswordRequest, "confirmPassword">) {
    const res = await publicApi.post("/user/reset-password", payload);
    return res.data;
  },
};

export default authService;
