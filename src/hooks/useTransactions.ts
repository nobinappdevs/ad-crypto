"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { DashboardTransaction } from "@/services/dashboard.service";
import {
  transactionService,
  type TransactionLogsData,
  type TransactionLogsParams,
} from "@/services/transaction.service";

export const TRANSACTIONS_KEY = ["transactions"] as const;

/**
 * GET /user/transaction/logs — one page of the ledger.
 *
 * `keepPreviousData` keeps the current rows on screen while the next set loads, so
 * the table cannot collapse and shove what is under the pointer.
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

/** What the ledger page reads: every page fetched so far, flattened, plus the count. */
export interface InfiniteTransactionLogs {
  rows: DashboardTransaction[];
  /** The server's total for the ACTIVE filter, not the rows held in memory. */
  total: number;
}

/**
 * The same endpoint, page after page, for a list that grows as it is scrolled.
 *
 * The filter and the search stay in the query key, so switching either starts a
 * fresh list rather than appending someone else's rows to the bottom of this one —
 * and `keepPreviousData` holds the old rows up meanwhile, so the panel does not
 * collapse to nothing between two filters.
 */
export function useInfiniteTransactionLogs(
  params: Omit<TransactionLogsParams, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: [...TRANSACTIONS_KEY, "infinite", params],
    queryFn: ({ pageParam }) => transactionService.logs({ ...params, page: pageParam }),
    enabled,
    initialPageParam: 1,
    // Laravel numbers its own pages, so the next one is simply the one after the
    // page that just arrived — until it IS the last, where undefined stops the list.
    getNextPageParam: (last) => {
      const paginator = last?.data?.transactions;
      const current = paginator?.current_page ?? 1;
      const lastPage = paginator?.last_page ?? 1;
      return current < lastPage ? current + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    select: (res): InfiniteTransactionLogs => ({
      rows: res.pages.flatMap((page) => page?.data?.transactions?.data ?? []),
      total: res.pages[0]?.data?.transactions?.total ?? 0,
    }),
  });
}
