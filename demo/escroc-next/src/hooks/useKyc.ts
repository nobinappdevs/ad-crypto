"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { kycService } from "@/services/kyc.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

/** GET /user/kyc/input-fields — KYC status + dynamic fields. */
export function useKycFields() {
  return useQuery({
    queryKey: ["kyc"],
    queryFn: () => kycService.getFields(),
  });
}

/** POST /user/kyc/submit — submit KYC docs, then refresh status. */
export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, Record<string, any>>({
    mutationFn: (fields) => kycService.submit(fields),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "KYC submitted for review"));
      qc.invalidateQueries({ queryKey: ["kyc"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
