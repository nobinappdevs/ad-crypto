"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  sellService,
  type SellDraft,
  type SellIndexData,
  type SellStoreRequest,
  type SellStoreResult,
} from "@/services/sell.service";
import type { KycValue } from "@/services/kyc.service";
import { getApiSuccessMessage } from "@/hooks/useAuth";
import { useTransactionError } from "@/hooks/useTransactionError";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const SELL_KEY = ["sell"] as const;

/**
 * GET /user/sell-crypto/index — coins, deposit addresses, payout methods. Refetched
 * on focus: it carries balances, and a sale in another tab changes them.
 */
export function useSellIndex(enabled = true) {
  return useQuery({
    queryKey: SELL_KEY,
    queryFn: () => sellService.index(),
    enabled,
    refetchOnWindowFocus: true,
    select: (res): SellIndexData => res?.data ?? {},
  });
}

/**
 * POST /user/sell-crypto/store — prices the sale and returns the payout form. No
 * success toast: the order has not run yet. Failures do toast.
 */
export function useStoreSell() {
  const onApiError = useTransactionError();
  return useMutation({
    mutationFn: async (payload: SellStoreRequest): Promise<SellStoreResult> => {
      const res = await sellService.store(payload);
      const result = res?.data;
      // Without an identifier there is nothing the later steps could advance, so a
      // 200 shaped like that is a failure however friendly it looks.
      if (!result?.data?.identifier) throw new Error("Sell quote returned no identifier");
      return result;
    },
    onError: onApiError,
  });
}

/**
 * POST /user/sell-crypto/sell-payment-store — claims the deposit address. Outside
 * orders only, silent on success: the next screen shows the address in full.
 */
export function useSellPaymentStore() {
  const onApiError = useTransactionError();
  return useMutation({
    mutationFn: async ({
      identifier,
      slug,
    }: {
      identifier: string;
      slug: string;
    }): Promise<SellDraft> => {
      const res = await sellService.sellPaymentStore(identifier, slug);
      return res?.data?.data ?? {};
    },
    onError: onApiError,
  });
}

/**
 * POST /user/sell-crypto/payment-info-store — the payout details and any proof.
 * Silent too: `confirm` places the order, and two toasts read as two events.
 */
export function usePaymentInfoStore() {
  const onApiError = useTransactionError();
  return useMutation({
    mutationFn: ({
      identifier,
      values,
    }: {
      identifier: string;
      values: Record<string, KycValue>;
    }) => sellService.paymentInfoStore(identifier, values),
    onError: onApiError,
  });
}

/**
 * POST /user/sell-crypto/confirm — executes the draft. The call that moves coins, so
 * this page's balances, the dashboard's wallets and the ledger all go stale.
 */
export function useConfirmSell(successMessage: string) {
  const onApiError = useTransactionError();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier: string) => sellService.confirm(identifier),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: SELL_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: onApiError,
  });
}
