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
  /** The routes this coin can be moved over, operator-configured per currency. */
  networks?: CurrencyNetwork[];
}

/**
 * One network a currency is available on. The row is the JOIN — it carries this
 * coin's fee on that chain — while `network` is the chain itself.
 */
export interface CurrencyNetwork {
  id?: number;
  currency_id?: number;
  /** The fee for this coin on this network, as a decimal string. */
  fees?: string | number;
  network_id?: number;
  network?: {
    id?: number;
    coin_id?: number;
    slug?: string;
    name?: string;
    /** Typical arrival, in minutes. */
    arrival_time?: number;
    description?: string;
  };
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
 * Twelve months of activity. The arrays are per-month TRANSACTION COUNTS, not money
 * moved — verified against an account with two buys and one withdrawal.
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
   * Per-type payload. The coin sits at different depths by type (`wallet` for buy,
   * `sender_wallet`/`receiver_wallet` for exchange and withdraw), hence its own helper.
   *
   * The rest is not a fixed set either — the backend adds fields without warning, so
   * the shape stays open and `txDetails` renders whatever is there.
   */
  details?: {
    data?: TxQuote;
    /**
     * What the user typed and uploaded, echoed back with the declaration it was
     * asked for by. Named per flow: a manual purchase uses `input_values`, a sale
     * splits the payout form and the deposit proof into the other two.
     */
    input_values?: TxSubmittedField[];
    gateway_input_values?: TxSubmittedField[];
    outside_address_input_values?: TxSubmittedField[];
    /**
     * The gateway's own answer, verbatim — a Stripe checkout session runs to sixty
     * fields. Open, therefore, and read selectively: see `txGateway`.
     */
    gateway_response?: Record<string, TxDetailValue>;
  };
  /**
   * The SAME quote, at the row's own level — where a sale keeps it.
   *
   * A sell's `details` holds the payout form instead of the order, so its wallets,
   * method, network and `will_get` arrive here. `txQuote` reads whichever of the two
   * the row happens to use.
   */
  data?: TxQuote;
  /** Where an unfinished automatic payment can be resumed, when the API sends one. */
  submit_url?: string | null;
}

/**
 * The priced order as the log echoes it back — the wallets on each side, the rate,
 * the charges, and whatever else the flow recorded.
 *
 * Open past the wallets: the set is per type and the backend adds fields without
 * warning, so `txDetails` renders whatever is there rather than a fixed list.
 */
export interface TxQuote {
  wallet?: TxDetailWallet;
  sender_wallet?: TxDetailWallet;
  receiver_wallet?: TxDetailWallet;
  [key: string]: TxDetailValue;
}

/** One answered field of an operator-declared form, as the log echoes it back. */
export interface TxSubmittedField {
  /** "text" | "file" | "select" | … — the control it was collected with. */
  type?: string;
  /** The operator's own wording ("Transaction ID"), which is what to display. */
  label?: string;
  name?: string;
  value?: TxDetailValue;
  required?: boolean;
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
  /** 0/1 flags for the account's other gates, and when the email was confirmed. */
  email_verified?: number;
  email_verified_at?: string | null;
  sms_verified?: number;
  two_factor_verified?: number;
  two_factor_status?: number;
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
