import { privateApi } from "@/lib/axios";

/** How the API describes where an image lives; see `imageUrl` in `@/config/media`. */
export interface ImagePaths {
  base_url?: string;
  path_location?: string;
  default_image?: string;
}

export interface WalletCurrency {
  id?: number;
  name?: string;
  /** Ticker — "BTC", "ETH". Also the key the local brand palette is looked up by. */
  code?: string;
  /** Relative to `currency_image_paths`, e.g. "seeder/bitcoin.webp". */
  flag?: string;
}

export interface DashboardWallet {
  id?: number;
  /** The deposit address for this holding. */
  public_address?: string;
  /** A decimal STRING ("0.0666666666666670") — parse before doing arithmetic. */
  balance?: string | number;
  currency?: WalletCurrency;
}

/**
 * Twelve months of activity. The arrays are per-month TRANSACTION COUNTS, not
 * money moved — verified against an account whose two buy orders and one
 * withdrawal came back as `buy_data[7] === 2` and `withdraw_data[7] === 1`.
 */
export interface DashboardChart {
  labels?: string[];
  buy_data?: number[];
  sell_data?: number[];
  withdraw_data?: number[];
}

/** A row of `recent_transactions`. Money fields are decimal strings. */
export interface DashboardTransaction {
  id?: number;
  /** "Buy Crypto" | "Sell Crypto" | "Withdraw Crypto" | "Exchange Crypto". */
  type?: string;
  trx_id?: string;
  amount?: string | number;
  /** The two halves `total_charge` is the sum of. */
  percent_charge?: string | number;
  fixed_charge?: string | number;
  total_charge?: string | number;
  total_payable?: string | number;
  /** The wallet balance left after the order settled. */
  available_balance?: string | number;
  /** The server's own description — "Exchange Crypto With Ethereum". */
  remark?: string | null;
  /** 1 Pending, 2 Confirmed, 3 Cancelled, 4 Rejected. */
  status?: number;
  reject_reason?: string | null;
  created_at?: string;
  /**
   * Per-type payload. The coin involved lives at different depths depending on
   * the type — `wallet` for buy, `sender_wallet`/`receiver_wallet` for exchange
   * and withdraw — which is why reading it is its own helper.
   *
   * The rest of the payload is per type as well and NOT a fixed set: a sell paid
   * out to a bank carries a branch and an account number, a withdraw carries an
   * address, and the backend adds fields without warning. Hence the open shape —
   * `txDetails` in `@/config/txlog` renders whatever is actually there.
   */
  details?: {
    data?: {
      wallet?: TxDetailWallet;
      sender_wallet?: TxDetailWallet;
      receiver_wallet?: TxDetailWallet;
      [key: string]: TxDetailValue;
    };
  };
}

/** A wallet as the detail payload carries it — the name and ticker are what's read. */
export interface TxDetailWallet {
  name?: string;
  code?: string;
  [key: string]: TxDetailValue;
}

/** Anything a detail field can hold. Scalars render; nested objects render if named. */
export type TxDetailValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [key: string]: TxDetailValue }
  | TxDetailValue[];

export interface DashboardData {
  /** 0 Unverified, 1 Verified, 2 Pending, 3 Rejected — same scale as KYC. */
  kyc_verified?: number;
  wallets?: DashboardWallet[];
  currency_image_paths?: ImagePaths;
  chart?: DashboardChart;
  recent_transactions?: DashboardTransaction[];
}

export const dashboardService = {
  /** GET /user/dashboard — wallets, 12-month chart, recent activity, KYC state. */
  async get(): Promise<{ data?: DashboardData }> {
    const res = await privateApi.get("/user/dashboard");
    return res.data;
  },
};

export default dashboardService;
