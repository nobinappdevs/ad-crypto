import { publicApi, privateApi } from "@/lib/axios";
import { clearAuthState } from "@/lib/authState";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/schemas/auth.schema";

/**
 * Every auth endpoint, in the order the flows run. Paths are relative to
 * `NEXT_PUBLIC_API_URL`. `publicApi` for what a signed-out visitor does, `privateApi`
 * for the rest — including register-time verification, which uses register's token.
 */
export const authService = {
  /* ── Sign-up + sign-in ── */

  /** POST /register — returns `data.token` plus the new (unverified) user. */
  async register(payload: RegisterRequest) {
    const { policy, ...rest } = payload;
    const res = await publicApi.post("/register", { ...rest, policy: policy ? "on" : "" });
    return res.data;
  },

  /** POST /login — returns `data.user_data.token`. */
  async login(payload: LoginRequest) {
    const res = await publicApi.post("/login", payload);
    return res.data;
  },

  /* ── Email verification (authed with the register/login token) ── */

  /** POST /user/verify/code — confirms the 6-digit code that was mailed out. */
  async verifyCode(code: string) {
    const res = await privateApi.post("/user/verify/code", { code });
    return res.data;
  },

  /** GET /user/resend/code — rate-limited server-side; the error carries the wait. */
  async resendCode() {
    const res = await privateApi.get("/user/resend/code");
    return res.data;
  },

  /* ── Session teardown ── */

  /**
   * POST /user/logout. The local session goes regardless of how the call ends — an
   * expired session is exactly when logout fails.
   *
   * `clearAuthState`, not just the token: the verification mirrors describe the
   * account being signed out, and the next sign-in must not inherit them.
   */
  async logout(): Promise<void> {
    try {
      await privateApi.post("/user/logout");
    } finally {
      clearAuthState();
    }
  },

  /** POST /user/profile/delete-account — soft-deletes and bans the account. */
  async deleteAccount() {
    const res = await privateApi.post("/user/profile/delete-account");
    return res.data;
  },

  /* ── Forgot password (public, threaded on a server-issued token) ── */

  /** POST /password/forgot/find/user — mails a code, returns `data.token`. */
  async forgotFindUser(payload: ForgotPasswordRequest) {
    const res = await publicApi.post("/password/forgot/find/user", payload);
    return res.data;
  },

  /** GET /password/forgot/resend/code — may rotate the token, so read it back. */
  async forgotResendCode(token: string) {
    const res = await publicApi.get("/password/forgot/resend/code", { params: { token } });
    return res.data;
  },

  /** POST /password/forgot/verify/code — the code alone isn't enough; token too. */
  async forgotVerifyCode(payload: { token: string; code: string }) {
    const res = await publicApi.post("/password/forgot/verify/code", payload);
    return res.data;
  },

  /** POST /password/forgot/reset — final step; the token dies with it. */
  async resetPassword(payload: ResetPasswordRequest & { token: string }) {
    const res = await publicApi.post("/password/forgot/reset", payload);
    return res.data;
  },
};

export default authService;
