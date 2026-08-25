import { publicApi, privateApi } from "@/lib/axios";
import { clearAuthState } from "@/lib/authState";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/schemas/auth.schema";

/**
 * Every auth endpoint in the AdCrypto collection, in the order the flows run.
 *
 * Paths are relative to `NEXT_PUBLIC_API_URL` (`.../public/api/v1`). `publicApi`
 * for anything a signed-out visitor performs, `privateApi` for the rest — note
 * that the register-time email verification is in the *private* group: register
 * hands back a working token, and the verify/resend pair authenticate with it.
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
   * POST /user/logout. The local session goes regardless of how the call ends:
   * an expired session is exactly when logout fails, and leaving the token
   * behind would strand the browser in a signed-in state it can't use.
   *
   * `clearAuthState`, not just the token — the verification mirrors describe the
   * account that is being signed out, and a guard reading one of them against the
   * next account's token is how a fresh sign-in inherits somebody else's gate.
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
