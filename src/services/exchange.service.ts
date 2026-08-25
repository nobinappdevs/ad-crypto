import { privateApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";

/**
 * Exchange Crypto — `GET /user/exchange-crypto/index`, `POST .../store`, `.../confirm`.
 *
 * A swap is TWO requests: `store` prices and drafts it, `confirm` executes. Nothing
 * moves until the second, so the user sees the server's figures before committing.
 */

/** The user's holding in one currency. `id` is the WALLET's id, not the coin's. */
export interface ExchangeUserWallet {
  id?: number;
  user_id?: number;
  currency_id?: number;
  public_address?: string;
  /** A decimal STRING ("68.9900000000000000"). */
  balance?: string | number;
}

export interface ExchangeCurrency {
  id?: number;
  name?: string;
  code?: string;
  symbol?: string;
  /** Relative to `currency_image_paths`, e.g. "seeder/bitcoin.webp". */
  flag?: string;
  /**
   * How many of this coin one unit of the base currency buys, as a decimal string —
   * so a pair's rate is the RATIO of the two. See `exchangeQuote`.
   */
  rate?: string | number;
  /**
   * This currency's wallets — empty for a coin never held. No wallet means no id to
   * post, which is why such a coin cannot be a side of a swap.
   */
  wallets?: ExchangeUserWallet[];
}

/**
 * The operator's charge configuration. `fixed_charge` is in the base currency and
 * converted at the SENDER's rate; `percent_charge` is a percentage of the amount
 * sent. Both come out on top, not out of what is received.
 */
export interface ExchangeFees {
  title?: string;
  fixed_charge?: string | number;
  percent_charge?: string | number;
  min_limit?: string | number;
  max_limit?: string | number;
}

export interface ExchangeIndexData {
  currencies?: ExchangeCurrency[];
  transaction_fees?: ExchangeFees;
  currency_image_paths?: ImagePaths;
}

/** A side of the quote, as the server resolved it. */
export interface ExchangeQuoteWallet {
  id?: number;
  name?: string;
  code?: string;
  rate?: string | number;
  balance?: string | number;
}

/**
 * The priced order, all of it the SERVER's. The page previews locally while the
 * user types, but from `store` onwards these are the figures shown.
 */
export interface ExchangeQuote {
  sender_wallet?: ExchangeQuoteWallet;
  receiver_wallet?: ExchangeQuoteWallet;
  /** Receiver coin per 1 sender coin. */
  exchange_rate?: number;
  sending_amount?: number;
  fixed_charge?: number;
  percent_charge?: number;
  total_charge?: number;
  /** Sending amount + total charge — what leaves the sender wallet. */
  payable_amount?: number;
  /** What lands in the receiving wallet. */
  get_amount?: number;
}

export interface ExchangeDraft {
  type?: string;
  /** The handle `confirm` takes. Without it the draft cannot be executed. */
  identifier?: string;
  id?: number;
  created_at?: string;
  data?: ExchangeQuote;
}

export interface ExchangeStoreRequest {
  send_amount: number | string;
  /** The user's WALLET id for the coin being sent — `currencies[].wallets[].id`. */
  sender_wallet: number;
  /**
   * The user's WALLET id for the coin being received — `currencies[].wallets[].id`
   * again, NOT `currencies[].id`. The name says currency and means wallet; the reply
   * echoes it back as `receiver_wallet`.
   */
  receiver_currency: number;
}

export const exchangeService = {
  /** GET /user/exchange-crypto/index — coins, the user's wallets, and the charges. */
  async index(): Promise<{ data?: ExchangeIndexData }> {
    const res = await privateApi.get("/user/exchange-crypto/index");
    return res.data;
  },

  /**
   * POST /user/exchange-crypto/store — prices the swap and drafts it. Nothing has
   * moved; `confirm` is what spends the balance.
   */
  async store(payload: ExchangeStoreRequest): Promise<{ data?: { data?: ExchangeDraft } }> {
    const form = new FormData();
    form.append("send_amount", String(payload.send_amount));
    form.append("sender_wallet", String(payload.sender_wallet));
    form.append("receiver_currency", String(payload.receiver_currency));

    const res = await privateApi.post("/user/exchange-crypto/store", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/exchange-crypto/confirm — executes the draft `store` returned. */
  async confirm(identifier: string) {
    const form = new FormData();
    form.append("identifier", identifier);

    const res = await privateApi.post("/user/exchange-crypto/confirm", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default exchangeService;
