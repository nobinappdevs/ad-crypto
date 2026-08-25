"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { kycService, type KycData, type KycValue } from "@/services/kyc.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

export const KYC_KEY = ["kyc"] as const;

/** GET /user/profile/kyc/input-fields — status + the form to render. */
export function useKycFields(enabled = true) {
  return useQuery({
    queryKey: KYC_KEY,
    queryFn: () => kycService.getFields(),
    enabled,
    select: (res): KycData => res?.data ?? {},
  });
}

/**
 * POST /user/profile/kyc/submit. Refetches rather than assuming status 2 — whether a
 * submission lands as "pending" is the reviewer's workflow, and the body is empty.
 */
export function useSubmitKyc(successMessage: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: Record<string, KycValue>) => kycService.submit(values),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: KYC_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * Field name -> first complaint, from a 422 on submit. KYC answers with a keyed bag
 * (unlike the auth endpoints' flat list), so each message goes under its control.
 */
export function getKycFieldErrors(err: unknown): Record<string, string> {
  const bag = (err as { response?: { data?: { errors?: Record<string, unknown> } } })?.response?.data
    ?.errors;
  if (!bag || typeof bag !== "object") return {};

  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(bag)) {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (typeof first === "string" && first) out[field] = first;
  }
  return out;
}
