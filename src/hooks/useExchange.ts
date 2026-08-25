"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  exchangeService,
  type ExchangeDraft,
  type ExchangeIndexData,
  type ExchangeStoreRequest,
} from "@/services/exchange.service";
import { getApiSuccessMessage } from "@/hooks/useAuth";
import { useTransactionError } from "@/hooks/useTransactionError";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const EXCHANGE_KEY = ["exchange"] as const;

/**
 * GET /user/exchange-crypto/index — coins, rates, holdings. Refetched on focus: it
 * carries balances, and a swap in another tab changes them.
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
 * POST /user/exchange-crypto/store — prices the swap. No success toast: this only
 * produces a quote. Failures do toast — a rejected quote is the user's answer.
 */
export function useStoreExchange() {
  const onApiError = useTransactionError();
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
    onError: onApiError,
  });
}

/**
 * POST /user/exchange-crypto/confirm — executes the draft.
 *
 * The call that moves money, so three caches go stale: the exchange index, the
 * dashboard, and the ledger. Invalidated rather than patched — the server owns the
 * figures.
 */
export function useConfirmExchange(successMessage: string) {
  const onApiError = useTransactionError();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier: string) => exchangeService.confirm(identifier),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: EXCHANGE_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: onApiError,
  });
}
