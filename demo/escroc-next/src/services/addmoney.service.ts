import { privateApi } from "@/lib/axios";
import type { MoWallet, GatewayCurrency, MoTransaction } from "@/services/moneyout.service";

export interface AddMoneyData {
  base_curr: string;
  base_curr_rate: string;
  default_image: string;
  image_path: string;
  base_url: string;
  userWallet: MoWallet[];
  gatewayCurrencies: GatewayCurrency[];
  transactionss: MoTransaction[];
}

export interface AddMoneySubmitPayload {
  gateway_currency: string; // gateway alias
  sender_currency: string;  // wallet currency code
  amount: number;
  source?: string;          // "WEB" — tells the API to redirect back to the browser
  success_url?: string;     // where the hosted gateway returns on success (required when source=WEB)
  cancel_url?: string;      // where the hosted gateway returns on cancel (required when source=WEB)
}

/** A single hosted-checkout link (PayPal-style `url` arrays carry several). */
export interface AddMoneyLink {
  href: string;
  rel: string;
  method: string;
}

export interface AddMoneySubmitData {
  gategay_type?: string; // backend typo on some gateways
  gateway_type?: string;
  gateway_currency_name: string;
  alias: string;
  identify: string;
  payment_informations: Record<string, string>;
  url: string | AddMoneyLink[];
  method: string;
}

export const addMoneyService = {
  /** GET /user/add-money/index — wallets, gateways, charges + deposit history. */
  async getInfo(): Promise<{ data: AddMoneyData }> {
    const res = await privateApi.get("/user/add-money/index");
    return res.data;
  },

  /** POST /user/add-money/submit — start a deposit; AUTOMATIC gateways return a checkout URL. */
  async submit(payload: AddMoneySubmitPayload): Promise<{ data: AddMoneySubmitData }> {
    const form = new FormData();
    form.append("gateway_currency", payload.gateway_currency);
    form.append("sender_currency", payload.sender_currency);
    form.append("amount", String(payload.amount));
    // WEB deposits go through a hosted gateway that redirects the browser back
    // to our success/cancel pages once the user finishes (or aborts) payment.
    if (payload.source) form.append("source", payload.source);
    if (payload.success_url) form.append("success_url", payload.success_url);
    if (payload.cancel_url) form.append("cancel_url", payload.cancel_url);
    const res = await privateApi.post("/user/add-money/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** GET /add-money/payment/crypto/address/{trx_id} — the crypto address for a waiting deposit. */
  async cryptoAddress(trxId: string) {
    const res = await privateApi.get(`/add-money/payment/crypto/address/${trxId}`);
    return res.data;
  },

  /**
   * POST {submit_url} — confirm a native-crypto deposit (e.g. Tatum). The submit
   * response supplies the absolute `address_info.submit_url`; we post the dynamic
   * input fields (e.g. txn_hash) to it.
   */
  async cryptoConfirm(submitUrl: string, fields: Record<string, any>) {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof File !== "undefined" && value instanceof File) form.append(key, value);
      else form.append(key, String(value));
    });
    const res = await privateApi.post(submitUrl, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * POST /user/add-money/manual/payment/confirmed — submit manual-gateway proof.
   * The trx is sent as `track`; the dynamic input fields (files included) follow.
   */
  async manualConfirm({ trx, fields }: { trx: string; fields: Record<string, any> }) {
    const form = new FormData();
    form.append("track", trx);
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof File !== "undefined" && value instanceof File) form.append(key, value);
      else form.append(key, String(value));
    });
    const res = await privateApi.post("/user/add-money/manual/payment/confirmed", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /add-money/authorize-payment-submit — pay an Authorize (card) deposit. */
  async authorizeConfirm(payload: { trx: string; card_number: string; date: string; code: string }) {
    const form = new FormData();
    form.append("trx", payload.trx);
    form.append("card_number", payload.card_number);
    form.append("date", payload.date);
    form.append("code", payload.code);
    const res = await privateApi.post("/add-money/authorize-payment-submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default addMoneyService;
