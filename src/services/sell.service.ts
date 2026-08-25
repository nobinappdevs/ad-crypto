import { privateApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";
import type { BuyCurrency, BuyGateway } from "@/services/buy.service";
import type { KycField, KycValue } from "@/services/kyc.service";

/**
 * Sell Crypto — which calls run depends on where the coins come from.
 *
 * `GET  /user/sell-crypto/index`               what can be sold, and how it can be paid out
 * `POST /user/sell-crypto/store`               prices the order AND returns the payout form to fill
 * `POST /user/sell-crypto/sell-payment-store`  claims a deposit address (OUTSIDE only)
 * `POST /user/sell-crypto/payment-info-store`  the payout details, and any proof of the transfer
 * `POST /user/sell-crypto/confirm`             executes it
 *
 * Inside Wallet:  store → payment-info-store → confirm
 * Outside Wallet: store → sell-payment-store → payment-info-store → confirm
 *
 * Charges run the opposite way to a purchase: denominated in the COIN and added on
 * top (`total_payable` is what leaves), while `will_get` is the gross converted at
 * the payout rate.
 */

/** The coins are the buy index's, field for field — same nesting, same `wallet`. */
export type SellCurrency = BuyCurrency;
export type SellGateway = BuyGateway;

/**
 * A platform address for one coin on one network, for coins arriving from outside.
 * `slug` is what `sell-payment-store` takes; `input_fields` is the proof wanted back.
 */
export interface OutsideAddress {
  id?: number;
  currency_id?: number;
  network_id?: number;
  slug?: string;
  public_address?: string;
  desc?: string;
  input_fields?: KycField[];
  status?: number;
}

export interface SellIndexData {
  /** ["Inside Wallet", "Outside Wallet"] — posted back verbatim as `wallet_type`. */
  wallet_type?: string[];
  currencies?: SellCurrency[];
  outside_wallet_address?: OutsideAddress[];
  payment_gateway?: SellGateway[];
  currency_image_paths?: ImagePaths;
  payment_image_paths?: ImagePaths;
}

export interface SellQuoteWallet {
  type?: string;
  wallet_id?: number;
  currency_id?: number;
  name?: string;
  code?: string;
  rate?: string | number;
  balance?: string | number;
}

export interface SellQuoteNetwork {
  id?: number;
  name?: string;
  arrival_time?: number;
}

export interface SellQuoteMethod {
  id?: number;
  name?: string;
  code?: string;
  alias?: string;
  rate?: string | number;
}

/** Present once `sell-payment-store` has claimed one. Empty strings before that. */
export interface SellQuoteAddress {
  id?: number | string;
  public_address?: string;
  slug?: string;
}

/**
 * The priced order. `amount`, the charges and `total_payable` are in the COIN;
 * `will_get` is in the payout method's currency.
 */
export interface SellQuote {
  sender_wallet?: SellQuoteWallet;
  network?: SellQuoteNetwork;
  payment_method?: SellQuoteMethod;
  outside_address?: SellQuoteAddress;
  /** A JSON STRING of the values already submitted, once there are any. */
  details?: string;
  amount?: number;
  /** Payout currency per 1 coin. */
  exchange_rate?: number;
  /** Coin per 1 unit of the payout currency — the inverse, used for the limits. */
  min_max_rate?: number;
  fixed_charge?: number;
  percent_charge?: number;
  total_charge?: number;
  /** Amount + charges: what leaves the wallet, in the coin. */
  total_payable?: number;
  /** What the user is paid, in the payout currency. */
  will_get?: number;
}

export interface SellDraft {
  type?: string;
  /** The handle every later step takes. */
  identifier?: string;
  id?: number;
  created_at?: string;
  data?: SellQuote;
}

/**
 * What `store` answers with — more than a quote: `desc` and `payment_gateway_fields`
 * are the payout method's instructions and form, so the next screen needs no request.
 */
export interface SellStoreResult {
  data?: SellDraft;
  desc?: string;
  payment_gateway_fields?: KycField[];
}

export interface SellStoreRequest {
  /** Verbatim from `wallet_type` in the index payload. */
  wallet_type: string;
  /** The CURRENCY's id. */
  sender_currency: number;
  /** The chosen network's `network_id`, not its row `id`. */
  network: number;
  amount: number | string;
  /** The payout method's `id`. */
  payment_method: number;
}

export const sellService = {
  /** GET /user/sell-crypto/index — coins, deposit addresses, and payout methods. */
  async index(): Promise<{ data?: SellIndexData }> {
    const res = await privateApi.get("/user/sell-crypto/index");
    return res.data;
  },

  /**
   * POST /user/sell-crypto/store — prices, drafts, and hands back the payout form.
   * Nothing has left the wallet when this returns.
   */
  async store(payload: SellStoreRequest): Promise<{ data?: SellStoreResult }> {
    const form = new FormData();
    form.append("wallet_type", payload.wallet_type);
    form.append("sender_currency", String(payload.sender_currency));
    form.append("network", String(payload.network));
    form.append("amount", String(payload.amount));
    form.append("payment_method", String(payload.payment_method));

    const res = await privateApi.post("/user/sell-crypto/store", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * POST /user/sell-crypto/sell-payment-store — claims the deposit address (outside
   * orders only). The draft comes back with `outside_address` filled in.
   */
  async sellPaymentStore(identifier: string, slug: string): Promise<{ data?: { data?: SellDraft } }> {
    const form = new FormData();
    form.append("identifier", identifier);
    form.append("slug", slug);

    const res = await privateApi.post("/user/sell-crypto/sell-payment-store", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * POST /user/sell-crypto/payment-info-store — where the money goes, plus the proof
   * the coins were sent.
   *
   * One call for both sets; the API echoes them back separated. Multipart for the
   * screenshot, and empty values are dropped rather than sent as "".
   */
  async paymentInfoStore(identifier: string, values: Record<string, KycValue>) {
    const form = new FormData();
    form.append("identifier", identifier);
    for (const [name, value] of Object.entries(values)) {
      if (value === null || value === undefined || value === "") continue;
      form.append(name, value instanceof File ? value : String(value));
    }

    const res = await privateApi.post("/user/sell-crypto/payment-info-store", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/sell-crypto/confirm — executes the draft. */
  async confirm(identifier: string) {
    const form = new FormData();
    form.append("identifier", identifier);

    const res = await privateApi.post("/user/sell-crypto/confirm", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default sellService;
