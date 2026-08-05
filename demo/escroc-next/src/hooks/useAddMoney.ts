"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMoneyService, type AddMoneySubmitPayload } from "@/services/addmoney.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import toast from "react-hot-toast";

/** GET /user/add-money/index — wallets, gateways, charges + deposit history. */
export function useAddMoney() {
  return useQuery({
    queryKey: ["add-money"],
    queryFn: () => addMoneyService.getInfo(),
  });
}

/** POST /user/add-money/submit — start a deposit. Component decides what's next. */
export function useSubmitAddMoney() {
  return useMutation<{ data: any }, unknown, AddMoneySubmitPayload>({
    mutationFn: (payload) => addMoneyService.submit(payload),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/add-money/manual/payment/confirmed — submit manual-gateway proof. */
export function useAddMoneyManualConfirm() {
  const qc = useQueryClient();
  return useMutation<any, unknown, { trx: string; fields: Record<string, any> }>({
    mutationFn: (p) => addMoneyService.manualConfirm(p),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment submitted for review"));
      qc.invalidateQueries({ queryKey: ["add-money"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET /add-money/payment/crypto/address/{trx_id} — crypto address for a waiting deposit. */
export function useAddMoneyCryptoAddress(trxId: string | null) {
  return useQuery({
    queryKey: ["add-money", "crypto-address", trxId],
    queryFn: () => addMoneyService.cryptoAddress(trxId!),
    enabled: !!trxId,
  });
}

/** POST {submit_url} — confirm a native-crypto deposit (Tatum etc.). */
export function useAddMoneyCryptoConfirm() {
  const qc = useQueryClient();
  return useMutation<any, unknown, { submitUrl: string; fields: Record<string, any> }>({
    mutationFn: (p) => addMoneyService.cryptoConfirm(p.submitUrl, p.fields),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment submitted for confirmation"));
      qc.invalidateQueries({ queryKey: ["add-money"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /add-money/authorize-payment-submit — pay an Authorize (card) deposit. */
export function useAddMoneyAuthorize() {
  const qc = useQueryClient();
  return useMutation<any, unknown, { trx: string; card_number: string; date: string; code: string }>({
    mutationFn: (p) => addMoneyService.authorizeConfirm(p),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment successful"));
      qc.invalidateQueries({ queryKey: ["add-money"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
