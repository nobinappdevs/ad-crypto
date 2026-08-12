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
import {
  setEmailVerified,
  startEmailOtpFlow,
  setOtpEmail,
  clearOtpFlow,
  clearAuthState,
  emailVerifiedFromResponse,
  setTwoFaState,
  readTwoFaState,
  twoFaStateFromResponse,
} from "@/lib/authState";
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

/**
 * `data.user.email_verified` — 0 when the backend just mailed an OTP, 1 when
 * the account is already usable. Absent (older/other responses) is treated as
 * unverified so we keep the safe "go verify" path.
 */
function isEmailVerified(res: unknown): boolean {
  return emailVerifiedFromResponse(res) ?? false;
}

/**
 * Mirrors the response's 2FA flags locally and reports whether a code is still
 * owed. A response without the flags leaves the stored value alone — "unknown"
 * must not silently downgrade a session that was already waiting on a code.
 */
function trackTwoFa(res: unknown): boolean {
  const state = twoFaStateFromResponse(res);
  if (state) setTwoFaState(state);
  return (state ?? readTwoFaState()) === "pending";
}

/* ─────────────────────────── Login ─────────────────────────── */
export function useLogin() {
  const router = useRouter();
  return useMutation<LoginResponse, unknown, LoginRequest & { recaptchaToken?: string }>({
    mutationFn: (payload) => authService.login(payload),
    onSuccess: (res, variables) => {
      if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, res.data.token);
      const verified = isEmailVerified(res);
      setEmailVerified(verified);
      const owesTwoFaCode = trackTwoFa(res);
      toast.success(getApiSuccessMessage(res, "Login successful"));

      // Signing in with an unverified email ("Please check email and verify
      // your account") — the token works, but the OTP step comes first.
      if (!verified) {
        startEmailOtpFlow("login", variables.email);
        router.replace("/verify-otp");
        return;
      }
      clearOtpFlow();
      // 2FA is on for this account and this session hasn't answered its code
      // yet — the authenticator step stands between login and the dashboard.
      if (owesTwoFaCode) {
        router.replace("/verify-2fa");
        return;
      }
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
    onSuccess: (res, variables) => {
      // A signup token (if returned) lets the email-verify call authenticate.
      const token = extractToken(res);
      if (token && typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
      const verified = isEmailVerified(res);
      setEmailVerified(verified);
      // A fresh account has no authenticator attached; record whatever the
      // response says so the guard starts from a known state.
      setTwoFaState(twoFaStateFromResponse(res) ?? "off");

      // Email already verified (e.g. verification switched off server-side) —
      // the signup token is a real session, so skip the OTP step entirely.
      if (verified) {
        clearOtpFlow();
        toast.success(getApiSuccessMessage(res, "Account created"));
        router.replace(postAuthDestination());
        return;
      }

      startEmailOtpFlow("register", variables.email);
      toast.success(getApiSuccessMessage(res, "Account created — verify your email"));
      router.replace("/verify-otp");
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
        setOtpEmail(email);
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
        clearOtpFlow();
        [RESET_EMAIL, RESET_TOKEN].forEach((k) => sessionStorage.removeItem(k));
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
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, string>({
    mutationFn: (otp) => authService.verifyEmailOtp(otp),
    onSuccess: (res) => {
      setEmailVerified(true);
      clearOtpFlow();
      // The guard reads the profile too — drop the stale copy so the dashboard
      // doesn't see `email_verified: 0` and bounce us straight back here.
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(getApiSuccessMessage(res, "Email verified"));
      // An account with 2FA switched on still owes its authenticator code.
      if (trackTwoFa(res)) {
        router.replace("/verify-2fa");
        return;
      }
      router.replace(postAuthDestination());
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* ─────────────────────────── Google 2FA verify ─────────────────────────── */
export function useVerifyGoogle2fa() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, string>({
    mutationFn: (otp) => authService.verifyGoogle2fa(otp),
    onSuccess: (res) => {
      setTwoFaState("ok");
      // AuthGuard re-checks the profile copy of `two_factor_verified`; the
      // cached one still says 0, so it has to go or the dashboard bounces back.
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(getApiSuccessMessage(res, "Two-factor verified"));
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
/** GET /user/profile. `enabled` lets the guard skip it while signed out. */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authService.getProfile(),
    enabled,
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
      // authService.logout() drops the token; clear the verified flag with it so
      // the next sign-in starts from a clean slate.
      clearAuthState();
      queryClient.clear();
      toast.success("Logged out");
      router.replace("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
