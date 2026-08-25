"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { securityService, type Google2faData } from "@/services/security.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { setTwoFaState } from "@/lib/authState";

export const GOOGLE_2FA_KEY = ["google-2fa"] as const;

/** GET /user/profile/google-2fa — secret, otpauth URI, status, and the API's note. */
export function useGoogle2fa(enabled = true) {
  return useQuery({
    queryKey: GOOGLE_2FA_KEY,
    queryFn: () => securityService.getGoogle2fa(),
    enabled,
    // The secret is stable per account, but the status changes from under us on
    // every toggle, so this is refetched rather than cached for the session.
    staleTime: 0,
    select: (res): Google2faData => res?.data ?? {},
  });
}

/**
 * POST /user/profile/google-2fa/status/update. The mirror is written from the status
 * just set, not the response (which is empty) — a stale one would gate the user.
 */
export function useUpdate2faStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ status, code }: { status: 0 | 1; code: string }) =>
      securityService.updateGoogle2faStatus(status, code),
    onSuccess: (res, { status }) => {
      // Enabling proves the authenticator works by requiring a live code, so the
      // session has effectively already answered one.
      setTwoFaState(status === 1 ? "ok" : "off");
      queryClient.invalidateQueries({ queryKey: GOOGLE_2FA_KEY });
      toast.success(getApiSuccessMessage(res, "Two-factor settings updated"));
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/google-2fa/otp/verify — the code standing between login and the
 * dashboard when the account has an authenticator attached.
 */
export function useVerify2faOtp(successMessage: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (otp: string) => securityService.verifyGoogle2faOtp(otp),
    onSuccess: (res) => {
      setTwoFaState("ok");
      queryClient.clear();
      toast.success(getApiSuccessMessage(res, successMessage));
      router.replace("/dashboard");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
