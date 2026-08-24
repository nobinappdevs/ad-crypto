"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  withdrawService,
  type WalletAddressCheck,
  type WithdrawDraft,
  type WithdrawIndexData,
  type WithdrawStoreRequest,
} from "@/services/withdraw.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const WITHDRAW_KEY = ["withdraw"] as const;

/**
 * GET /user/withdraw-crypto/index — the coins, their rates, and what the user holds.
 *
 * Refetched on focus for the same reason the dashboard is: this payload carries
 * balances, and a withdrawal made in another tab has to be visible here before
 * the next one is priced against a figure that is no longer true.
 */
export function useWithdrawIndex(enabled = true) {
  return useQuery({
    queryKey: WITHDRAW_KEY,
    queryFn: () => withdrawService.index(),
    enabled,
    refetchOnWindowFocus: true,
    select: (res): WithdrawIndexData => res?.data ?? {},
  });
}

/**
 * GET /user/withdraw-crypto/check-wallet-address — what an address turns out to be.
 *
 * Not retried: "Receiver address not found" is an ANSWER, not a failure, and
 * asking three times cannot change it. Cached per address so re-checking one the
 * user has already typed costs nothing, and never refetched on focus — an
 * address does not become a different wallet while the tab is in the background.
 */
export function useWalletAddressCheck(address: string, enabled = true) {
  return useQuery({
    queryKey: [...WITHDRAW_KEY, "address", address],
    queryFn: () => withdrawService.checkAddress(address),
    enabled: enabled && address.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
    select: (res): WalletAddressCheck => res?.data ?? {},
  });
}

/**
 * POST /user/withdraw-crypto/store — prices the withdrawal.
 *
 * No success toast: this step only produces a quote, and a "done" message on an
 * order that has not run yet is what would make the two-step flow unreadable.
 * Failures do toast — "Wallet not found!" is the user's answer.
 */
export function useStoreWithdraw() {
  return useMutation({
    mutationFn: async (payload: WithdrawStoreRequest): Promise<WithdrawDraft> => {
      const res = await withdrawService.store(payload);
      const draft = res?.data?.data;
      // Without an identifier there is nothing `confirm` could execute, so a 200
      // shaped like that is a failure however friendly it looks.
      if (!draft?.identifier) throw new Error("Withdrawal quote returned no identifier");
      return draft;
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/withdraw-crypto/confirm — executes the draft.
 *
 * The call that moves the coins, so three caches go stale with it: this page's
 * balances, the dashboard's wallets, and the ledger the withdrawal is now a row in.
 */
export function useConfirmWithdraw(successMessage: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier: string) => withdrawService.confirm(identifier),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: WITHDRAW_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
