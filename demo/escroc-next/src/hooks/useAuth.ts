"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  authService,
  type RegisterPayload,
  type VerifyForgotOtpPayload,
  type ResetPasswordPayload,
} from "@/services/auth.service";
import { TOKEN_KEY } from "@/lib/axios";
import { readPendingEscrow, clearPendingEscrow, pendingEscrowUrl } from "@/lib/pendingEscrow";
import { stopBeamsClient } from "@/lib/pushClient";
import type { LoginRequest, LoginResponse } from "@/schemas/auth.schema";

/**
 * After authenticating, forward to the homepage banner's pending create-escrow
 * (carried in the URL) if one was stashed; otherwise land on the dashboard.
 */
function postAuthDestination(): string {
  const pending = readPendingEscrow();
  if (pending) {
    clearPendingEscrow();
    return pendingEscrowUrl(pending);
  }
  return "/dashboard";
}

/* ── sessionStorage keys shared across the reset flow ── */
const RESET_TOKEN = "escroc_reset_token";
const RESET_EMAIL = "escroc_reset_email";

/* ── message helpers (Laravel wraps messages as { success: [...] } / { error: [...] }) ── */
export function getApiErrorMessage(err: unknown): string {
  const data = (err as { response?: { data?: { message?: unknown; errors?: Record<string, string[]> } } })
    .response?.data;
  const m = data?.message;
  if (typeof m === "string") return m;
  if (m && typeof m === "object") {
    const arr = Object.values(m as Record<string, unknown>).find(Array.isArray) as string[] | undefined;
    if (arr?.[0]) return arr[0];
  }
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return "Something went wrong. Please try again.";
}

export function getApiSuccessMessage(res: unknown, fallback: string): string {
  const msg = (res as { message?: { success?: string[] } })?.message?.success;
  return msg?.[0] ?? fallback;
}

function extractToken(res: unknown): string | undefined {
  const r = res as {
    data?: { token?: string; user?: { token?: string } };
    token?: string;
  };
  // Laravel returns the token either at data.user.token (forgot/send-otp),
  // data.token (login), or top-level token depending on the endpoint.
  return r?.data?.user?.token ?? r?.data?.token ?? r?.token;
}

/* ─────────────────────────── Login ─────────────────────────── */
export function useLogin() {
  const router = useRouter();
  return useMutation<LoginResponse, unknown, LoginRequest & { recaptchaToken?: string }>({
    mutationFn: (payload) => authService.login(payload),
    onSuccess: (res) => {
      if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, res.data.token);
      toast.success(getApiSuccessMessage(res, "Login successful"));
      router.replace(postAuthDestination());
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Register ─────────────────────────── */
export function useRegister() {
  const router = useRouter();
  return useMutation<unknown, unknown, RegisterPayload & { recaptchaToken?: string }>({
    mutationFn: (payload) => authService.register(payload),
    onSuccess: (res) => {
      // A signup token (if returned) lets the email-verify call authenticate.
      const token = extractToken(res);
      if (token && typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
      if (typeof window !== "undefined") sessionStorage.setItem("escroc_otp_flow", "email");
      toast.success(getApiSuccessMessage(res, "Account created — verify your email"));
      router.push("/verify-otp");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Forgot: send OTP ─────────────────────────── */
export function useForgotSendOtp() {
  const router = useRouter();
  return useMutation<unknown, unknown, string>({
    mutationFn: (email) => authService.forgotSendOtp(email),
    onSuccess: (res, email) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("escroc_otp_flow", "reset");
        sessionStorage.setItem(RESET_EMAIL, email);
        const token = extractToken(res);
        if (token) sessionStorage.setItem(RESET_TOKEN, token);
      }
      toast.success(getApiSuccessMessage(res, "OTP sent to your email"));
      router.push("/verify-otp");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Forgot: verify OTP ─────────────────────────── */
export function useForgotVerifyOtp() {
  const router = useRouter();
  return useMutation<unknown, unknown, VerifyForgotOtpPayload>({
    mutationFn: (payload) => authService.forgotVerifyOtp(payload),
    onSuccess: (res) => {
      // If the API returns a fresh token after OTP verify, update it for the reset step.
      const newToken = extractToken(res);
      if (newToken && typeof window !== "undefined") sessionStorage.setItem(RESET_TOKEN, newToken);
      toast.success(getApiSuccessMessage(res, "Code verified"));
      router.push("/reset-password");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Reset password ─────────────────────────── */
export function useResetPassword() {
  const router = useRouter();
  return useMutation<unknown, unknown, ResetPasswordPayload>({
    mutationFn: (payload) => authService.resetPassword(payload),
    onSuccess: (res) => {
      if (typeof window !== "undefined") {
        ["escroc_otp_flow", RESET_EMAIL, RESET_TOKEN].forEach((k) => sessionStorage.removeItem(k));
      }
      toast.success(getApiSuccessMessage(res, "Password reset — please sign in"));
      router.push("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Email verify / resend ─────────────────────────── */
export function useEmailVerify() {
  const router = useRouter();
  return useMutation<unknown, unknown, string>({
    mutationFn: (otp) => authService.verifyEmailOtp(otp),
    onSuccess: (res) => {
      if (typeof window !== "undefined") sessionStorage.removeItem("escroc_otp_flow");
      toast.success(getApiSuccessMessage(res, "Email verified"));
      router.replace(postAuthDestination());
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useResendEmail() {
  return useMutation<unknown, unknown, void>({
    mutationFn: () => authService.resendEmailCode(),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, "Code resent")),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Session ─────────────────────────── */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authService.getProfile(),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Unregister this device from Beams so the next account on this browser
      // doesn't hit "Changing the `userId` is not allowed" (fire-and-forget).
      void stopBeamsClient();
      queryClient.clear();
      toast.success("Logged out");
      router.replace("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
