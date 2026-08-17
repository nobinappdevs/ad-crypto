"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  exchangeService,
  type ExchangeDraft,
  type ExchangeIndexData,
  type ExchangeStoreRequest,
} from "@/services/exchange.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const EXCHANGE_KEY = ["exchange"] as const;

/**
 * GET /user/exchange-crypto/index — the coins, their rates, and what the user holds.
 *
 * Refetched on focus like the dashboard is: this payload carries balances, and a
 * swap made in another tab has to be visible here before the next one is priced
 * against a figure that is no longer true.
 */
export function useExchangeIndex(enabled = true) {
  return useQuery({
    queryKey: EXCHANGE_KEY,
    queryFn: () => exchangeService.index(),
    enabled,
    refetchOnWindowFocus: true,
    select: (res): ExchangeIndexData => res?.data ?? {},
  });
}

/**
 * POST /user/exchange-crypto/store — prices the swap.
 *
 * Deliberately NOT toasting on success: this step only produces a quote, and a
 * "done" toast on an order that has not run yet is the one message that would
 * make the two-step flow unreadable. Failures do toast, because a rejected quote
 * ("You cannot exchange crypto using the same wallet") is the user's answer.
 */
export function useStoreExchange() {
  return useMutation({
    mutationFn: async (payload: ExchangeStoreRequest): Promise<ExchangeDraft> => {
      const res = await exchangeService.store(payload);
      const draft = res?.data?.data;
      // Without an identifier there is nothing `confirm` could execute, so a 200
      // shaped like that is a failure however friendly it looks. Throwing routes
      // it into the same toast as a 4xx instead of leaving the button dead.
      if (!draft?.identifier) throw new Error("Exchange quote returned no identifier");
      return draft;
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/exchange-crypto/confirm — executes the draft.
 *
 * This is the call that moves money, so three caches are now stale: the exchange
 * index (both balances changed), the dashboard (wallets and the activity chart),
 * and the ledger (a row was written). Invalidating rather than patching leaves
 * the figures to the server, which is the only party that knows them.
 */
export function useConfirmExchange(successMessage: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier: string) => exchangeService.confirm(identifier),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: EXCHANGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
