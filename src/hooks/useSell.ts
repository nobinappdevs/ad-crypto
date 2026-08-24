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
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const SELL_KEY = ["sell"] as const;

/**
 * GET /user/sell-crypto/index — the coins, the deposit addresses and the payout
 * methods.
 *
 * Refetched on focus for the same reason the dashboard is: this payload carries
 * balances, and a sale made in another tab has to be visible here before the next
 * one is priced against a figure that is no longer true.
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
 * POST /user/sell-crypto/store — prices the sale and returns the payout form.
 *
 * No success toast: this step only produces a quote and a form to fill in, and a
 * "done" message on an order that has not run yet is what would make the flow
 * unreadable. Failures do toast — "network Not Found!" is the user's answer.
 */
export function useStoreSell() {
  return useMutation({
    mutationFn: async (payload: SellStoreRequest): Promise<SellStoreResult> => {
      const res = await sellService.store(payload);
      const result = res?.data;
      // Without an identifier there is nothing the later steps could advance, so a
      // 200 shaped like that is a failure however friendly it looks.
      if (!result?.data?.identifier) throw new Error("Sell quote returned no identifier");
      return result;
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/sell-crypto/sell-payment-store — claims the deposit address.
 *
 * Outside orders only, and silent on success: what it returns is an address to
 * send coins to, which the next screen is about to show in full.
 */
export function useSellPaymentStore() {
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
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/sell-crypto/payment-info-store — the payout details and any proof.
 *
 * Silent on success as well: `confirm` is what actually places the order, and two
 * toasts for one button press reads as two things having happened.
 */
export function usePaymentInfoStore() {
  return useMutation({
    mutationFn: ({
      identifier,
      values,
    }: {
      identifier: string;
      values: Record<string, KycValue>;
    }) => sellService.paymentInfoStore(identifier, values),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/sell-crypto/confirm — executes the draft.
 *
 * The call that moves the coins, so three caches go stale with it: this page's
 * balances, the dashboard's wallets, and the ledger the sale is now a row in.
 */
export function useConfirmSell(successMessage: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier: string) => sellService.confirm(identifier),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: SELL_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
