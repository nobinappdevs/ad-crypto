"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  buyService,
  type AuthorizeCardRequest,
  type BuyDraft,
  type BuyIndexData,
  type BuyStoreRequest,
  type BuySubmitResult,
  type ManualGatewayData,
} from "@/services/buy.service";
import type { KycValue } from "@/services/kyc.service";
import { getApiSuccessMessage } from "@/hooks/useAuth";
import { useTransactionError } from "@/hooks/useTransactionError";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const BUY_KEY = ["buy"] as const;

/**
 * GET /user/buy-crypto/index — coins, networks, payment methods. Refetched on focus:
 * it carries live rates and the charge table.
 */
export function useBuyIndex(enabled = true) {
  return useQuery({
    queryKey: BUY_KEY,
    queryFn: () => buyService.index(),
    enabled,
    refetchOnWindowFocus: true,
    select: (res): BuyIndexData => res?.data ?? {},
  });
}

/**
 * POST /user/buy-crypto/store — prices the order. No success toast: this only
 * produces a quote. Failures do toast; the message is the user's answer.
 */
export function useStoreBuy() {
  const onApiError = useTransactionError();
  return useMutation({
    mutationFn: async (payload: BuyStoreRequest): Promise<BuyDraft> => {
      const res = await buyService.store(payload);
      const draft = res?.data?.data;
      // Without an identifier there is nothing the later steps could advance, so a
      // 200 shaped like that is a failure however friendly it looks.
      if (!draft?.identifier) throw new Error("Buy quote returned no identifier");
      return draft;
    },
    onError: onApiError,
  });
}

/**
 * POST /user/buy-crypto/submit — hands the draft to an automatic gateway. Success is
 * not a purchase, so nothing is toasted; the answer is a place to continue.
 */
export function useSubmitBuy() {
  const onApiError = useTransactionError();
  return useMutation({
    mutationFn: async (identifier: string): Promise<BuySubmitResult> => {
      const res = await buyService.submit(identifier);
      return res?.data ?? {};
    },
    onError: onApiError,
  });
}

/**
 * GET /user/buy-crypto/manual/input-fields — the form a manual gateway wants. Left
 * stale a while: it changes when an operator edits the gateway.
 */
export function useManualGatewayFields(alias: string, enabled = true) {
  return useQuery({
    queryKey: [...BUY_KEY, "manual", alias],
    queryFn: () => buyService.manualFields(alias),
    enabled: enabled && alias.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
    select: (res): ManualGatewayData => res?.data ?? {},
  });
}

/**
 * POST /user/buy-crypto/manual/submit — proof of a payment made by hand. The order
 * exists after this, so the ledger and dashboard go stale even with no coins moved.
 */
export function useManualSubmit(successMessage: string) {
  const onApiError = useTransactionError();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      identifier,
      values,
    }: {
      identifier: string;
      values: Record<string, KycValue>;
    }) => buyService.manualSubmit(identifier, values),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: BUY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: onApiError,
  });
}

/**
 * POST /user/buy-crypto/authorize-payment-submit — the card, charged on the spot.
 * The one step here that completes a purchase, so everything it touched is invalidated.
 */
export function useAuthorizeSubmit(successMessage: string) {
  const onApiError = useTransactionError();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AuthorizeCardRequest) => buyService.authorizeSubmit(payload),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: BUY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: onApiError,
  });
}
