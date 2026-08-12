"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { kycService } from "@/services/kyc.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";

/** KYC status codes — 0 Unverified, 1 Verified, 2 Pending, 3 Rejected. */
export const KYC_VERIFIED = 1;

/** Shared so the gate can read the same cache the KYC page fills. */
export const kycQueryOptions = {
  queryKey: ["kyc"],
  queryFn: () => kycService.getFields(),
};

/** GET /user/kyc/input-fields — KYC status + dynamic fields. */
export function useKycFields() {
  return useQuery(kycQueryOptions);
}

/** POST /user/kyc/submit — submit KYC docs, then refresh status. */
export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, Record<string, any>>({
    mutationFn: (fields) => kycService.submit(fields),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "KYC submitted for review"));
      qc.invalidateQueries({ queryKey: kycQueryOptions.queryKey });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * Blocks a money-moving submit until KYC is verified.
 *
 * Call it at the top of a submit handler and bail when it resolves false — the
 * user is told why and sent to /dashboard/kyc. Everything but status 1 is
 * blocked, pending and rejected included.
 *
 * The status is fetched on submit, not on page load, so browsing costs nothing.
 * `fetchQuery` with a short staleTime means repeated submits reuse the cached
 * answer, but a status that was approved a while ago is re-read rather than
 * blocking on a stale copy. A failed call can't prove verification, so it
 * blocks too.
 *
 * Add Money is deliberately not gated — funding the account has to work before
 * verification.
 */
const KYC_GATE_STALE_MS = 30_000;

export function useKycGate() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useLang();
  const message = t("dashboard.kyc.requiredNotice");

  return useCallback(async (): Promise<boolean> => {
    let status: number | undefined;
    try {
      const res = await qc.fetchQuery({ ...kycQueryOptions, staleTime: KYC_GATE_STALE_MS });
      status = res?.data?.kyc_status;
    } catch {
      status = undefined;
    }
    if (status === KYC_VERIFIED) return true;

    toast.error(message, { id: "kyc-required" });
    router.push("/dashboard/kyc");
    return false;
  }, [qc, router, message]);
}
