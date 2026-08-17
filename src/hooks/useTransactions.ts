"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  transactionService,
  type TransactionLogsData,
  type TransactionLogsParams,
} from "@/services/transaction.service";

export const TRANSACTIONS_KEY = ["transactions"] as const;

/**
 * GET /user/transaction/logs — one page of the ledger.
 *
 * `keepPreviousData` is the point of interest: paging or switching a filter keeps
 * the current rows on screen while the next set is fetched, so the table does not
 * collapse to a skeleton and shove the pagination controls up under the pointer
 * that just clicked them. `isFetching` drives a quiet dimming instead.
 */
export function useTransactionLogs(params: TransactionLogsParams, enabled = true) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, params],
    queryFn: () => transactionService.logs(params),
    enabled,
    placeholderData: keepPreviousData,
    select: (res): TransactionLogsData => res?.data ?? {},
  });
}
