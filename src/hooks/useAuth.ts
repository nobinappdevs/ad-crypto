"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import {
  clearAuthState,
  clearResetToken,
  emailVerificationFromResponse,
  extractToken,
  needsEmailVerification,
  readResetToken,
  readTwoFaState,
  setEmailVerificationRequired,
  setEmailVerified,
  setResetToken,
  setToken,
  setTwoFaState,
  twoFaStateFromResponse,
} from "@/lib/authState";
import { clearPendingEmail, setPendingEmail } from "@/lib/pendingEmail";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/schemas/auth.schema";

/* -------------------------------------------------------------------------- */
/* Message helpers                                                            */
/* -------------------------------------------------------------------------- */

const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * Depth-first search for the first non-empty string in a message payload.
 *
 * Recursive because `message.error` comes in two shapes from the same API: a flat
 * array of sentences from `/register`, and a nested bag from `/login`. `depth` is a
 * stop, so a self-referential object cannot spin.
 */
function firstMessage(value: unknown, depth = 0): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (depth >= 5 || !value || typeof value !== "object") return undefined;
  for (const item of Object.values(value)) {
    const found = firstMessage(item, depth + 1);
    if (found) return found;
  }
  return undefined;
}

/** The first human sentence out of an error response, whatever shape it took. */
export function getApiErrorMessage(err: unknown): string {
  const data = (err as { response?: { data?: { message?: unknown; errors?: unknown } } })?.response
    ?.data;
  if (!data) return GENERIC_ERROR;
  return firstMessage(data.message) ?? firstMessage(data.errors) ?? GENERIC_ERROR;
}

/** `message.success[0]` with the caller's localized fallback. */
export function getApiSuccessMessage(res: unknown, fallback: string): string {
  return (res as { message?: { success?: string[] } })?.message?.success?.[0] ?? fallback;
}

/**
 * Mirrors a response's 2FA flags and reports whether a code is owed. A response
 * without them leaves the stored value alone — "unknown" must not clear a session.
 */
function trackTwoFa(res: unknown): boolean {
  const state = twoFaStateFromResponse(res);
  if (state) setTwoFaState(state);
  return (state ?? readTwoFaState()) === "pending";
}

/**
 * Stores everything a register/login response says about the session, and reports
 * whether an email code is owed.
 *
 * Shared by both, so neither can forget a field the guards read. The token goes in
 * even when a code is owed — the verify and resend calls authenticate with it.
 */
function trackAuthResponse(res: unknown): boolean {
  const token = extractToken(res);
  if (token) setToken(token);

  const verificationRequired = emailVerificationFromResponse(res);
  if (verificationRequired !== undefined) setEmailVerificationRequired(verificationRequired);

  const needsCode = needsEmailVerification(res);
  setEmailVerified(!needsCode);
  return needsCode;
}

/* -------------------------------------------------------------------------- */
/* Register + email verification                                              */
/* -------------------------------------------------------------------------- */

/**
 * POST /register. The response carries a usable token even while unverified — the
 * verify call needs it — so it is stored either way; only the destination differs:
 *
 *   email_verification: true  + email_verified: 0  ->  /verify-email
 *   email_verification: true  + email_verified: 1  ->  /dashboard
 *   email_verification: false                      ->  /dashboard, nothing to ask
 */
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (res, variables) => {
      // What this browser fetched for the previous session belongs to it, and the
      // guards read `["dashboard"]` — a leftover copy would gate this account.
      queryClient.clear();

      const needsCode = trackAuthResponse(res);
      // A brand-new account has no authenticator attached; record whatever the
      // response says so the guard starts from a known state instead of "unknown".
      setTwoFaState(twoFaStateFromResponse(res) ?? "off");

      if (!needsCode) {
        clearPendingEmail();
        toast.success(getApiSuccessMessage(res, "Registration successful"));
        router.replace("/dashboard");
        return;
      }

      // Carried over so the verify screen can name the address it mailed — the
      // response has no field for it, only the account it just created.
      setPendingEmail(variables.email);
      toast.success(getApiSuccessMessage(res, "Registration successful"));
      router.replace("/verify-email");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/verify/code — the code mailed at sign-up. */
export function useVerifyCode(successMessage: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => authService.verifyCode(code),
    onSuccess: (res) => {
      setEmailVerified(true);
      clearPendingEmail();
      // Anything cached while the account was still unverified is stale now.
      queryClient.clear();
      toast.success(getApiSuccessMessage(res, successMessage));
      // Clearing the email gate doesn't clear the 2FA one — an account with an
      // authenticator attached still owes that code before the dashboard opens.
      router.replace(readTwoFaState() === "pending" ? "/verify-2fa" : "/dashboard");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * GET /user/resend/code. The backend's refusal says how long is left, so its
 * message is surfaced verbatim rather than replaced.
 */
export function useResendCode() {
  return useMutation({
    mutationFn: () => authService.resendCode(),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, "Verification code sent")),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* -------------------------------------------------------------------------- */
/* Login                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * POST /login. A token comes back even when the account cannot use it yet, so two
 * gates follow, in order: the email address, then the authenticator.
 */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (res, variables) => {
      // Signing in is a new session even when it is the same person: nothing this
      // browser cached under the previous token describes it. The guards read
      // `["dashboard"]` too, so a stale copy would gate the wrong account.
      queryClient.clear();

      const needsCode = trackAuthResponse(res);
      const owesTwoFaCode = trackTwoFa(res);
      toast.success(getApiSuccessMessage(res, "Login successful"));

      if (needsCode) {
        setPendingEmail(variables.email);
        router.replace("/verify-email");
        return;
      }
      clearPendingEmail();
      // 2FA is on for this account and this session hasn't answered its code yet.
      if (owesTwoFaCode) {
        router.replace("/verify-2fa");
        return;
      }
      router.replace("/dashboard");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* -------------------------------------------------------------------------- */
/* Session teardown                                                           */
/* -------------------------------------------------------------------------- */

/** POST /user/logout. */
export function useLogout(successMessage = "Logged out") {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    // `onSettled`, not `onSuccess`: the service drops the token even when the
    // call fails, so the app must finish signing out either way or the UI keeps
    // showing a session that no longer exists.
    onSettled: () => {
      clearAuthState();
      queryClient.clear();
      toast.success(successMessage);
      router.replace("/login");
    },
  });
}

/** POST /user/profile/delete-account — irreversible; confirm before calling. */
export function useDeleteAccount(successMessage = "Account deleted") {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: (res) => {
      clearAuthState();
      queryClient.clear();
      toast.success(getApiSuccessMessage(res, successMessage));
      router.replace("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/* -------------------------------------------------------------------------- */
/* Forgot password — find user -> verify code -> reset                         */
/* -------------------------------------------------------------------------- */

/**
 * Step 1, POST /password/forgot/find/user. The token in the response is what the
 * next two steps identify the request by, so it is stored before reporting success.
 */
export function useForgotFindUser() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authService.forgotFindUser(payload),
    onSuccess: (res) => {
      const token = extractToken(res);
      if (token) setResetToken(token);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET /password/forgot/resend/code — reads the token back in case it rotated. */
export function useForgotResendCode() {
  return useMutation({
    mutationFn: () => authService.forgotResendCode(readResetToken()),
    onSuccess: (res) => {
      const token = extractToken(res);
      if (token) setResetToken(token);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** Step 2, POST /password/forgot/verify/code. */
export function useForgotVerifyCode() {
  return useMutation({
    mutationFn: (code: string) =>
      authService.forgotVerifyCode({ token: readResetToken(), code }),
    onSuccess: (res) => {
      const token = extractToken(res);
      if (token) setResetToken(token);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** Step 3, POST /password/forgot/reset. Ends at `/login`, not the dashboard —
 *  resetting a password does not create a session. */
export function useResetPassword(successMessage: string) {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPassword({ ...payload, token: readResetToken() }),
    onSuccess: (res) => {
      clearResetToken();
      toast.success(getApiSuccessMessage(res, successMessage));
      router.push("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
