"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { moneyOutService, type MoneyOutSubmitPayload } from "@/services/moneyout.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

/** GET /user/money-out/index — wallets, gateways, charges + money-out history. */
export function useMoneyOut() {
  return useQuery({
    queryKey: ["money-out"],
    queryFn: () => moneyOutService.getInfo(),
  });
}

/** POST /user/money-out/submit — step 1: fetch the dynamic withdraw fields. */
export function useSubmitMoneyOut() {
  return useMutation<{ data: any }, unknown, MoneyOutSubmitPayload>({
    mutationFn: (payload) => moneyOutService.submit(payload),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET Flutterwave bank list (populates the bank_name select for those gateways). */
export function useFlutterwaveBanks(trx: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["flutterwave-banks", trx],
    queryFn: () => moneyOutService.getFlutterwaveBanks(trx!),
    enabled: enabled && !!trx,
  });
}

/** GET Flutterwave branch list for the selected bank (populates branch_code). */
export function useFlutterwaveBranches(trx: string | undefined, bankId: string | number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["flutterwave-branches", trx, bankId],
    queryFn: () => moneyOutService.getFlutterwaveBranches(trx!, bankId!),
    enabled: enabled && !!trx && !!bankId,
  });
}

/** POST step 2: finalize the withdraw (automatic/manual), then refresh + reset. */
export function useConfirmMoneyOut() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, { gatewayType: string; trx: string; fields: Record<string, any> }>({
    mutationFn: (params) => moneyOutService.confirm(params),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Withdraw request submitted"));
      qc.invalidateQueries({ queryKey: ["money-out"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
