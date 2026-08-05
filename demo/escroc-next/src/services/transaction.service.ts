import { privateApi } from "@/lib/axios";
import type { MoTransaction } from "@/services/moneyout.service";

/** One Laravel pagination link (prev / numbered / next). */
export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  from: number | null;
  to: number | null;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  links: PaginationLink[];
}

export interface AllTransactionsData {
  transactions: Paginated<MoTransaction>;
}

export const transactionService = {
  /** GET /user/all-transactions — paginated list of every wallet transaction. */
  async getAll(page = 1): Promise<{ data: AllTransactionsData }> {
    const res = await privateApi.get(`/user/all-transactions?page=${page}`);
    return res.data;
  },
};

export default transactionService;
