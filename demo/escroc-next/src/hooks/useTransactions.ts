"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { transactionService } from "@/services/transaction.service";

/**
 * GET /user/all-transactions — infinite (append) transaction history driven by
 * the backend Laravel paginator (`current_page` / `next_page_url`).
 */
export function useTransactions() {
  return useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: ({ pageParam }) => transactionService.getAll(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = (lastPage as any)?.data?.transactions;
      return p?.next_page_url ? Number(p.current_page) + 1 : undefined;
    },
  });
}
