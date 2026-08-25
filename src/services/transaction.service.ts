import { privateApi } from "@/lib/axios";
import type { DashboardTransaction } from "@/services/dashboard.service";

/**
 * The ledger, from `GET /user/transaction/logs`.
 *
 * The rows are the same shape as the dashboard's `recent_transactions`, so they
 * reuse `DashboardTransaction` and one table renders both. What this adds is a type
 * filter, a reference search, and Laravel pagination.
 */

/** Laravel's paginator, trimmed to the parts the UI actually reads. */
export interface Paginated<T> {
  current_page?: number;
  data?: T[];
  last_page?: number;
  per_page?: number;
  /** 1-based index of the first and last row on this page; null on an empty page. */
  from?: number | null;
  to?: number | null;
  total?: number;
}

export interface TransactionLogsData {
  /** `{"1":"Pending","2":"STATUS_CONFIRM_PAYMENT",…}` — see `txStatusKey`. */
  status_code?: Record<string, string>;
  transactions?: Paginated<DashboardTransaction>;
}

export interface TransactionLogsParams {
  /**
   * One of buy | sell | withdraw | exchange. Anything else is a 400, so "all" is
   * expressed by leaving it out.
   */
  type?: string;
  /** Partial match on the reference, e.g. "BC692". */
  trx_id?: string;
  per_page?: number;
  page?: number;
}

export const transactionService = {
  async logs(params: TransactionLogsParams = {}): Promise<{ data?: TransactionLogsData }> {
    const res = await privateApi.get("/user/transaction/logs", {
      // Blank values are dropped rather than sent empty: `type=` is one of the
      // strings this endpoint rejects.
      params: {
        ...(params.type ? { type: params.type } : {}),
        ...(params.trx_id ? { trx_id: params.trx_id } : {}),
        per_page: params.per_page ?? 10,
        page: params.page ?? 1,
      },
    });
    return res.data;
  },
};

export default transactionService;
