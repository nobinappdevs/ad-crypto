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
import { getApiSuccessMessage } from "@/hooks/useAuth";
import { useTransactionError } from "@/hooks/useTransactionError";
import { DASHBOARD_KEY } from "@/hooks/useDashboard";
import { TRANSACTIONS_KEY } from "@/hooks/useTransactions";

export const WITHDRAW_KEY = ["withdraw"] as const;

/**
 * GET /user/withdraw-crypto/index — coins, rates, holdings. Refetched on focus: it
 * carries balances, and a withdrawal in another tab changes them.
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
 * Not retried: "Receiver address not found" is an ANSWER. Cached per address, and
 * never refetched on focus — an address does not become a different wallet.
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
 * POST /user/withdraw-crypto/store — prices the withdrawal. No success toast: the
 * order has not run yet. Failures do toast.
 */
export function useStoreWithdraw() {
  const onApiError = useTransactionError();
  return useMutation({
    mutationFn: async (payload: WithdrawStoreRequest): Promise<WithdrawDraft> => {
      const res = await withdrawService.store(payload);
      const draft = res?.data?.data;
      // Without an identifier there is nothing `confirm` could execute, so a 200
      // shaped like that is a failure however friendly it looks.
      if (!draft?.identifier) throw new Error("Withdrawal quote returned no identifier");
      return draft;
    },
    onError: onApiError,
  });
}

/**
 * POST /user/withdraw-crypto/confirm — executes the draft. The call that moves coins,
 * so this page's balances, the dashboard's wallets and the ledger all go stale.
 */
export function useConfirmWithdraw(successMessage: string) {
  const onApiError = useTransactionError();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identifier: string) => withdrawService.confirm(identifier),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: WITHDRAW_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY });
    },
    onError: onApiError,
  });
}
