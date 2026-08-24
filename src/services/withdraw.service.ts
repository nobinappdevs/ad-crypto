import { privateApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";
import type {
  ExchangeCurrency,
  ExchangeFees,
  ExchangeQuoteWallet,
} from "@/services/exchange.service";

/**
 * Withdraw Crypto — `GET /user/withdraw-crypto/index`, `GET .../check-wallet-address`,
 * `POST .../store`, `POST .../confirm`.
 *
 * Same two-step shape as an exchange: `store` prices the order and drafts it,
 * `confirm` executes it. What withdraw adds is the destination — an address the
 * API resolves for you, answering with the coin and rate behind it, which is why
 * the receiving side can be a DIFFERENT coin from the one being sent.
 */

/**
 * The index payload is the exchange index's, field for field — same currencies,
 * same nested user wallets, same charge table (under the "withdraw" slug). Shared
 * rather than copied, so a change to the shape is a change in one place.
 */
export type WithdrawCurrency = ExchangeCurrency;
export type WithdrawFees = ExchangeFees;

export interface WithdrawIndexData {
  currencies?: WithdrawCurrency[];
  transaction_fees?: WithdrawFees;
  currency_image_paths?: ImagePaths;
}

/**
 * `GET /user/withdraw-crypto/check-wallet-address` — what an address turns out
 * to be.
 *
 * A valid one comes back with the coin it belongs to and that coin's rate; an
 * unknown one is a 404 ("Receiver address not found"). So this is not a format
 * check — it is the lookup that decides what the recipient actually receives.
 */
export interface WalletAddressCheck {
  wallet_address?: string;
  rate?: string | number;
  code?: string;
}

/** The destination side of a withdrawal is an address, not a wallet the user owns. */
export type WithdrawReceiver = ExchangeQuoteWallet & { address?: string };

/** The priced order, from `store`. Every figure is the server's. */
export interface WithdrawQuote {
  sender_wallet?: ExchangeQuoteWallet;
  receiver_wallet?: WithdrawReceiver;
  amount?: number;
  fixed_charge?: number;
  percent_charge?: number;
  total_charge?: number;
  sender_ex_rate?: number;
  /** Receiver coin per 1 sender coin — 1 when both sides are the same coin. */
  exchange_rate?: number;
  /** Amount + total charge: what leaves the wallet. */
  payable_amount?: number;
  /** What arrives at the address. */
  will_get?: number;
}

export interface WithdrawDraft {
  type?: string;
  /** The handle `confirm` takes. Without it the draft cannot be executed. */
  identifier?: string;
  id?: number;
  created_at?: string;
  data?: WithdrawQuote;
}

export interface WithdrawStoreRequest {
  amount: number | string;
  /** The user's WALLET id for the coin being sent — `currencies[].wallets[].id`. */
  sender_wallet: number;
  wallet_address: string;
}

export const withdrawService = {
  /** GET /user/withdraw-crypto/index — coins, the user's wallets, and the charges. */
  async index(): Promise<{ data?: WithdrawIndexData }> {
    const res = await privateApi.get("/user/withdraw-crypto/index");
    return res.data;
  },

  /** GET /user/withdraw-crypto/check-wallet-address — resolves a destination. */
  async checkAddress(walletAddress: string): Promise<{ data?: WalletAddressCheck }> {
    const res = await privateApi.get("/user/withdraw-crypto/check-wallet-address", {
      params: { wallet_address: walletAddress },
    });
    return res.data;
  },

  /**
   * POST /user/withdraw-crypto/store — prices the withdrawal and drafts it.
   *
   * Nothing has left the wallet when this returns; `confirm` is what spends it.
   */
  async store(payload: WithdrawStoreRequest): Promise<{ data?: { data?: WithdrawDraft } }> {
    const form = new FormData();
    form.append("amount", String(payload.amount));
    form.append("sender_wallet", String(payload.sender_wallet));
    form.append("wallet_address", payload.wallet_address);

    const res = await privateApi.post("/user/withdraw-crypto/store", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/withdraw-crypto/confirm — executes the draft `store` returned. */
  async confirm(identifier: string) {
    const form = new FormData();
    form.append("identifier", identifier);

    const res = await privateApi.post("/user/withdraw-crypto/confirm", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default withdrawService;
