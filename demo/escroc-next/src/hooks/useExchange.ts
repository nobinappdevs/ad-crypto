"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { exchangeService, type ExchangeSubmitPayload } from "@/services/exchange.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

/** GET /user/money-exchange — wallets, rates, charges + exchange history. */
export function useMoneyExchange() {
  return useQuery({
    queryKey: ["money-exchange"],
    queryFn: () => exchangeService.getInfo(),
  });
}

/** POST /user/money-exchange/submit — exchange, then refresh balances + log. */
export function useSubmitExchange() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, ExchangeSubmitPayload>({
    mutationFn: (payload) => exchangeService.submit(payload),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Exchange successful"));
      qc.invalidateQueries({ queryKey: ["money-exchange"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
