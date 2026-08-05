"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { TOKEN_KEY } from "@/lib/axios";
import { env } from "@/config/env";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  VerifyOtpRequest,
} from "@/schemas/auth.schema";

/** Pull a human message out of any error shape (string | {success:[]} | errors{}). */
export function getApiErrorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (err as any)?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data.message === "string") return data.message;
  if (data.message?.error?.[0]) return data.message.error[0];
  if (data.errors) {
    const firstField = Object.keys(data.errors)[0];
    if (firstField) return data.errors[firstField]?.[0] ?? "Validation failed";
  }
  return "Something went wrong. Please try again.";
}

/** message.success[0] with a fallback. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getApiSuccessMessage(res: any, fallback: string): string {
  return res?.message?.success?.[0] ?? fallback;
}

/** Tokens land in different places per endpoint: data.user.token ?? data.token ?? token */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractToken(res: any): string | undefined {
  return res?.data?.user?.token ?? res?.data?.token ?? res?.token;
}

/* -------------------------------------------------------------------------- */
/* Demo mode — see env.noBackend for why this exists                            */
/* -------------------------------------------------------------------------- */

/**
 * Runs `real` unless `env.noBackend` is on, in which case it resolves a canned
 * response shaped like the API's own so `extractToken` and
 * `getApiSuccessMessage` keep working untouched. The short delay is what makes
 * the forms' pending states ("Signing in...", "Verifying...") actually visible.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function demoOr<T>(demo: () => any, real: () => Promise<T>) {
  if (!env.noBackend) return real();
  await new Promise((resolve) => setTimeout(resolve, 500));
  return demo();
}

const DEMO_NOTE = "(demo mode — no backend connected)";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) =>
      demoOr(
        // The guards only ever check that a token is present, so the value
        // carries nothing — keeping the email out of it avoids `btoa` throwing
        // on an address with non-Latin1 characters.
        () => ({
          data: { token: "demo-session" },
          message: { success: [`Signed in ${DEMO_NOTE}`] },
        }),
        () => authService.login(payload),
      ),
    onSuccess: (res) => {
      const token = extractToken(res);
      if (token && typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      toast.success(getApiSuccessMessage(res, "Login successful"));
      router.push("/dashboard");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** Step 1 of the reset flow: emails the account a one-time code. */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      demoOr(
        () => ({ message: { success: [`Code sent ${DEMO_NOTE}`] } }),
        () => authService.forgotPassword(payload),
      ),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** Step 2: confirms the code before the password field is ever shown. In demo
 *  mode any six digits pass — there is no code to compare against. */
export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload: VerifyOtpRequest) =>
      demoOr(
        () => ({ message: { success: [`Code verified ${DEMO_NOTE}`] } }),
        () => authService.verifyOtp(payload),
      ),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** Step 3: sets the new password, then sends the user back to log in with it.
 *  `successMessage` is the caller's localized fallback — this hook has no
 *  `useLang()` of its own, so the string comes from whichever form calls it. */
export function useResetPassword(successMessage: string) {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: Omit<ResetPasswordRequest, "confirmPassword">) =>
      demoOr(
        () => ({ message: { success: [`Password reset ${DEMO_NOTE}`] } }),
        () => authService.resetPassword(payload),
      ),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      router.push("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* -------------------------------------------------------------------------- */
/* Email verification (after sign-up)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Confirms the address a new account signed up with, then sends them to log in.
 *
 * The account exists at this point but is unverified, so there is no session to
 * put them into — verification ends at `/login`, not `/dashboard`. In demo mode
 * any six digits pass; there is no code to compare against.
 */
export function useVerifyEmail(successMessage: string) {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) =>
      demoOr(
        () => ({ message: { success: [`Email verified ${DEMO_NOTE}`] } }),
        () => authService.verifyEmail(payload),
      ),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      router.push("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** Sends a fresh verification code to the same address. */
export function useResendEmailOtp() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      demoOr(
        () => ({ message: { success: [`Code sent ${DEMO_NOTE}`] } }),
        () => authService.resendEmailOtp(payload),
      ),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
