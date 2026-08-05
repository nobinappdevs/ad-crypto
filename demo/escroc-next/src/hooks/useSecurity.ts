"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { securityService } from "@/services/security.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";

/** GET /user/profile/google-2fa/ — QR + secret + status. */
export function useGoogle2fa() {
  const { lang } = useLang();
  return useQuery({
    queryKey: ["google-2fa", lang],
    queryFn: () => securityService.getGoogle2fa(lang),
  });
}

/** POST /user/profile/google-2fa/status/update — toggle 2FA, then refresh. */
export function useUpdate2faStatus() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, { status: number; code: string }>({
    mutationFn: ({ status, code }) => securityService.updateStatus(status, code),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Two-factor settings updated"));
      qc.invalidateQueries({ queryKey: ["google-2fa"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
