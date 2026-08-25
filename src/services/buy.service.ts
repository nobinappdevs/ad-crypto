import { privateApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";
import type { KycField, KycValue } from "@/services/kyc.service";

/**
 * Buy Crypto — the longest flow in the app, and the only one that can leave the site.
 *
 * `GET  /user/buy-crypto/index`                     what can be bought, and how it can be paid for
 * `POST /user/buy-crypto/store`                     prices the order, returns a draft `identifier`
 * `POST /user/buy-crypto/submit`                    hands the draft to the gateway
 * `GET  /user/buy-crypto/manual/input-fields`       the form a MANUAL gateway wants
 * `POST /user/buy-crypto/manual/submit`             that form, plus the proof of payment
 * `POST /user/buy-crypto/authorize-payment-submit`  card details, for gateways we collect them for
 *
 * The gateway decides which of the last three runs: a `-manual` alias skips
 * `submit`, and everything else follows `submit`'s `redirect_url` — which for
 * Authorize.Net points back at us to collect the card.
 */

/** The user's holding in one currency. `id` is the WALLET's id, not the coin's. */
export interface BuyUserWallet {
  id?: number;
  user_id?: number;
  currency_id?: number;
  public_address?: string;
  /** A decimal STRING ("0.0000000000000000"). */
  balance?: string | number;
}

/**
 * A chain the coin can be delivered over. `store` wants `network_id`, not `id` —
 * the first is the network being referenced, the second this row's own key.
 */
export interface BuyNetwork {
  id?: number;
  currency_id?: number;
  network_id?: number;
  name?: string;
  /** Typical minutes to arrive. */
  arrival_time?: number;
}

export interface BuyCurrency {
  id?: number;
  name?: string;
  code?: string;
  symbol?: string;
  /** Relative to `currency_image_paths`, e.g. "seeder/bitcoin.webp". */
  flag?: string;
  /** How many of this coin one unit of the platform's base currency buys. */
  rate?: string | number;
  networks?: BuyNetwork[];
  /** This coin's wallets — SINGULAR here, unlike the exchange index's `wallets`. */
  wallet?: BuyUserWallet[];
}

/**
 * One way to pay, as configured by the operator. `rate` is against the base
 * currency, so a coin's price here is the ratio of the two rates. Limits and
 * `fixed_charge` are in the METHOD's currency; `percent_charge` is a percentage.
 */
export interface BuyGateway {
  id?: number;
  payment_gateway_id?: number;
  name?: string;
  /** "payment-method-jazzcash-pkr-manual" — the suffix is the settlement mode. */
  alias?: string;
  currency_code?: string;
  currency_symbol?: string;
  /** Relative to `payment_image_paths`. */
  image?: string | null;
  min_limit?: string | number;
  max_limit?: string | number;
  percent_charge?: string | number;
  fixed_charge?: string | number;
  rate?: string | number;
}

export interface BuyIndexData {
  /** ["Inside Wallet", "Outside Wallet"] — posted back verbatim as `wallet_type`. */
  wallet_type?: string[];
  currencies?: BuyCurrency[];
  payment_gateway?: BuyGateway[];
  currency_image_paths?: ImagePaths;
  payment_image_paths?: ImagePaths;
}

/** The coin side of the quote, as the server resolved it. */
export interface BuyQuoteWallet {
  type?: string;
  wallet_id?: number;
  currency_id?: number;
  name?: string;
  code?: string;
  rate?: string | number;
  /** Only for an "Outside Wallet" order — the address the coins are sent to. */
  address?: string;
  balance?: string | number;
}

export interface BuyQuoteNetwork {
  id?: number;
  name?: string;
  arrival_time?: number;
  fees?: string | number;
}

export interface BuyQuoteMethod {
  id?: number;
  name?: string;
  code?: string;
  alias?: string;
  rate?: string | number;
}

/**
 * The priced order. Every figure is the SERVER's, and all but `amount` and
 * `will_get` are in the PAYMENT method's currency.
 */
export interface BuyQuote {
  wallet?: BuyQuoteWallet;
  network?: BuyQuoteNetwork;
  payment_method?: BuyQuoteMethod;
  /** The coin amount being bought. */
  amount?: number;
  /** Payment currency per 1 coin. */
  exchange_rate?: number;
  /** Coin per 1 unit of the payment currency — the inverse, used for the limits. */
  min_max_rate?: number;
  fixed_charge?: number;
  percent_charge?: number;
  total_charge?: number;
  /** Converted amount + charges: what the user is actually charged. */
  payable_amount?: number;
  /** The coin amount that lands in the wallet. */
  will_get?: number;
}

export interface BuyDraft {
  type?: string;
  /** The handle every later step takes. Without it the draft cannot be advanced. */
  identifier?: string;
  id?: number;
  created_at?: string;
  data?: BuyQuote;
}

export interface BuyStoreRequest {
  /** Verbatim from `wallet_type` in the index payload. */
  wallet_type: string;
  /** The CURRENCY's id. */
  sender_currency: number;
  /** The chosen network's `network_id`, not its row `id`. */
  network: number;
  amount: number | string;
  /** The payment method's `id`. */
  payment_method: number;
  /** Required for "Outside Wallet", meaningless for "Inside Wallet". */
  wallet_address?: string;
}

/**
 * What `submit` answers with. `identifier` is a NEW handle scoped to that payment
 * attempt — the card step must post this one, not the draft's.
 */
export interface BuySubmitResult {
  redirect_url?: string;
  redirect_links?: unknown[];
  action_type?: string;
  address_info?: unknown;
  identifier?: string;
}

/** A manual gateway's instructions and the proof-of-payment form it wants. */
export interface ManualGatewayData {
  gateway?: {
    /** Operator-written HTML: bank details, wallet addresses, what to do. */
    desc?: string;
  };
  /** Same declaration shape as the KYC form, so the same renderer handles both. */
  input_fields?: KycField[];
  currency?: { alias?: string };
}

export interface AuthorizeCardRequest {
  /** The identifier from `submit`, not the draft's. */
  identifier: string;
  card_number: string;
  /** "YY/MM", as the API's own example posts it. */
  date: string;
  code: string;
}

export const buyService = {
  /** GET /user/buy-crypto/index — coins with their networks, and the payment methods. */
  async index(): Promise<{ data?: BuyIndexData }> {
    const res = await privateApi.get("/user/buy-crypto/index");
    return res.data;
  },

  /**
   * POST /user/buy-crypto/store — prices the order and drafts it. Nothing is charged;
   * it exists so the user sees the server's figures before agreeing.
   */
  async store(payload: BuyStoreRequest): Promise<{ data?: { data?: BuyDraft } }> {
    const form = new FormData();
    form.append("wallet_type", payload.wallet_type);
    form.append("sender_currency", String(payload.sender_currency));
    form.append("network", String(payload.network));
    form.append("amount", String(payload.amount));
    form.append("payment_method", String(payload.payment_method));
    if (payload.wallet_address) form.append("wallet_address", payload.wallet_address);

    const res = await privateApi.post("/user/buy-crypto/store", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/buy-crypto/submit — hands the draft to an automatic gateway. */
  async submit(identifier: string): Promise<{ data?: BuySubmitResult }> {
    const form = new FormData();
    form.append("identifier", identifier);

    const res = await privateApi.post("/user/buy-crypto/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** GET /user/buy-crypto/manual/input-fields — a manual gateway's own form. */
  async manualFields(alias: string): Promise<{ data?: ManualGatewayData }> {
    const res = await privateApi.get("/user/buy-crypto/manual/input-fields", {
      params: { alias },
    });
    return res.data;
  },

  /**
   * POST /user/buy-crypto/manual/submit — the filled form and the receipt. Multipart,
   * since a screenshot is usually one field; empty values are dropped, not sent as "".
   */
  async manualSubmit(identifier: string, values: Record<string, KycValue>) {
    const form = new FormData();
    form.append("identifier", identifier);
    for (const [name, value] of Object.entries(values)) {
      if (value === null || value === undefined || value === "") continue;
      form.append(name, value instanceof File ? value : String(value));
    }

    const res = await privateApi.post("/user/buy-crypto/manual/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/buy-crypto/authorize-payment-submit — the card, for Authorize.Net. */
  async authorizeSubmit(payload: AuthorizeCardRequest) {
    const form = new FormData();
    form.append("identifier", payload.identifier);
    form.append("card_number", payload.card_number);
    form.append("date", payload.date);
    form.append("code", payload.code);

    const res = await privateApi.post("/user/buy-crypto/authorize-payment-submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default buyService;
