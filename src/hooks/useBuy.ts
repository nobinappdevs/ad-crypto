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
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const BUY_KEY = ["buy"] as const;

/**
 * GET /user/buy-crypto/index — the coins, their networks, and the payment methods.
 *
 * Refetched on focus: the payload carries live rates and the operator's charge
 * table, and an order priced against yesterday's figures is an order the server
 * will re-price at the last step anyway.
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
 * POST /user/buy-crypto/store — prices the order.
 *
 * No success toast: this step only produces a quote, and a "done" message on an
 * order nobody has paid for is what would make the flow unreadable. Failures do
 * toast — "network Not Found!" is the user's answer.
 */
export function useStoreBuy() {
  return useMutation({
    mutationFn: async (payload: BuyStoreRequest): Promise<BuyDraft> => {
      const res = await buyService.store(payload);
      const draft = res?.data?.data;
      // Without an identifier there is nothing the later steps could advance, so a
      // 200 shaped like that is a failure however friendly it looks.
      if (!draft?.identifier) throw new Error("Buy quote returned no identifier");
      return draft;
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/buy-crypto/submit — hands the draft to an automatic gateway.
 *
 * Success here is not a completed purchase, so nothing is toasted and no cache is
 * invalidated: the answer is a place to continue, and the caller decides whether
 * that means leaving the site or collecting a card.
 */
export function useSubmitBuy() {
  return useMutation({
    mutationFn: async (identifier: string): Promise<BuySubmitResult> => {
      const res = await buyService.submit(identifier);
      return res?.data ?? {};
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * GET /user/buy-crypto/manual/input-fields — the form a manual gateway wants.
 *
 * Keyed by alias and left stale for a while: which fields an operator asks for
 * changes when they edit the gateway, not while somebody is filling it in.
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
 * POST /user/buy-crypto/manual/submit — the proof of a payment made by hand.
 *
 * The order exists after this, pending the operator's check, so the ledger and the
 * dashboard both go stale even though no coins have moved yet.
 */
export function useManualSubmit(successMessage: string) {
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
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/buy-crypto/authorize-payment-submit — the card, charged on the spot.
 *
 * The one step in this flow that completes a purchase without leaving the site,
 * so it invalidates everything the purchase changed: this page's rates and
 * wallets, the dashboard's balances, and the ledger the order is now a row in.
 */
export function useAuthorizeSubmit(successMessage: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AuthorizeCardRequest) => buyService.authorizeSubmit(payload),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: BUY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
