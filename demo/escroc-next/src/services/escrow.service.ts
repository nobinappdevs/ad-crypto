import { privateApi } from "@/lib/axios";

export interface EscrowCategory { id: number; name: string; }

export interface EscrowWallet {
  name: string;
  balance: number;
  currency_code: string;
  currency_symbol: string;
  currency_type: string;
  rate: number;
  flag: string;
  image_path: string;
}

export interface EscrowGateway {
  id: number;
  name: string;
  alias: string;
  currency_code: string;
  currency_symbol: string;
  type: string;
  image: string | null;
}

export interface EscrowCreateData {
  user_type: string;
  escrow_categories: EscrowCategory[];
  user_wallet: EscrowWallet[];
  gateway_currencies: EscrowGateway[];
  base_url: string;
}

export interface EscrowSubmitPayload {
  title: string;
  escrow_category: number | string;
  role: string;                 // buyer | seller
  who_will_pay_options: string; // me | receiver
  buyer_seller_identify: string; // counterparty email
  amount: number;
  escrow_currency: string;      // currency code
  payment_gateway: number | string;
  remarks?: string;
  files?: File[];
  source?: string;          // "WEB" — redirect back to the browser after checkout
  success_url?: string;     // hosted-gateway success return (required when source=WEB)
  cancel_url?: string;      // hosted-gateway cancel return (required when source=WEB)
}

export const escrowService = {
  /** GET /user/my-escrow/index — the user's escrow list. */
  async index() {
    const res = await privateApi.get("/user/my-escrow/index");
    return res.data;
  },

  /** GET /user/my-escrow/create — categories, wallets, gateways. */
  async createInfo(): Promise<{ data: EscrowCreateData }> {
    const res = await privateApi.get("/user/my-escrow/create");
    return res.data;
  },

  /** GET /user/my-escrow/user-check — validate a counterparty email. */
  async userCheck(email: string): Promise<{ data: { user_check: boolean } }> {
    const res = await privateApi.get(`/user/my-escrow/user-check?userCheck=${encodeURIComponent(email)}`);
    return res.data;
  },

  /** POST /user/my-escrow/submit — create an escrow. */
  async submit(payload: EscrowSubmitPayload) {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("escrow_category", String(payload.escrow_category));
    form.append("role", payload.role);
    form.append("who_will_pay_options", payload.who_will_pay_options);
    form.append("buyer_seller_identify", payload.buyer_seller_identify);
    form.append("amount", String(payload.amount));
    form.append("escrow_currency", payload.escrow_currency);
    form.append("payment_gateway", String(payload.payment_gateway));
    form.append("remarks", payload.remarks ?? "");
    (payload.files ?? []).forEach((f) => form.append("file[]", f));
    // WEB escrows go through a hosted gateway that redirects back to our
    // success/cancel pages once the buyer finishes (or aborts) payment.
    if (payload.source) form.append("source", payload.source);
    if (payload.success_url) form.append("success_url", payload.success_url);
    if (payload.cancel_url) form.append("cancel_url", payload.cancel_url);
    const res = await privateApi.post("/user/my-escrow/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** GET /user/api-escrow-action/conversation/{id} — escrow chat thread + status. */
  async conversation(id: string | number) {
    const res = await privateApi.get(`/user/api-escrow-action/conversation/${id}`);
    return res.data;
  },

  /** POST /user/api-escrow-action/message/send — send an escrow chat message (+ files). */
  async sendConversationMessage({ escrow_id, message, files }: { escrow_id: string | number; message: string; files?: File[] }) {
    const form = new FormData();
    form.append("escrow_id", String(escrow_id));
    form.append("message", message ?? "");
    (files ?? []).forEach((f) => form.append("files[]", f));
    const res = await privateApi.post("/user/api-escrow-action/message/send", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/api-escrow-action/release-request — seller asks the buyer to release funds. */
  async releaseRequest(target: string | number) {
    const form = new FormData();
    form.append("target", String(target));
    const res = await privateApi.post("/user/api-escrow-action/release-request", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/api-escrow-action/release-payment — buyer releases funds to seller. */
  async releasePayment(target: string | number) {
    const form = new FormData();
    form.append("target", String(target));
    const res = await privateApi.post("/user/api-escrow-action/release-payment", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/api-escrow-action/dispute-payment — open a dispute on the escrow. */
  async disputePayment(target: string | number) {
    const form = new FormData();
    form.append("target", String(target));
    const res = await privateApi.post("/user/api-escrow-action/dispute-payment", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /**
   * POST {submit_url} — confirm a native-crypto escrow payment (e.g. Tatum).
   * The confirm-escrow response supplies the absolute `address_info.submit_url`;
   * we post the dynamic input fields (e.g. txn_hash) to it.
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
   * GET the native-crypto payment address for a PAYMENT_WAITING escrow.
   *   mode "my"     → escrow owner  → /my-escrow/payment/crypto/address/{escrow_id}
   *   mode "action" → counterparty  → /api-escrow-action/payment/crypto/address/{escrow_id}
   * (Same path shape as the crypto *confirm* submit URLs.)
   */
  async cryptoAddress(mode: "my" | "action", escrowId: string | number) {
    const path = mode === "my"
      ? `/my-escrow/payment/crypto/address/${escrowId}`
      : `/api-escrow-action/payment/crypto/address/${escrowId}`;
    const res = await privateApi.get(path);
    return res.data;
  },

  /** POST /user/my-escrow/confirm-escrow — finalize after the preview. */
  async confirmEscrow(trx: string) {
    const form = new FormData();
    form.append("trx", trx);
    const res = await privateApi.post("/user/my-escrow/confirm-escrow", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** GET /user/api-escrow-action/payment/approval-pending/{id} — escrow + pay options. */
  async approvalPending(id: string | number) {
    const res = await privateApi.get(`/user/api-escrow-action/payment/approval-pending/${id}`);
    return res.data;
  },

  /** POST /user/api-escrow-action/escrow/payment/approval-submit/{id} — pick a gateway. */
  async approvalSubmit(
    id: string | number,
    payment_gateway: string,
    opts?: { source?: string; success_url?: string; cancel_url?: string },
  ) {
    const form = new FormData();
    form.append("payment_gateway", payment_gateway);
    // WEB payments go through a hosted gateway that redirects back to our
    // success/cancel pages once the buyer finishes (or aborts) payment.
    if (opts?.source) form.append("source", opts.source);
    if (opts?.success_url) form.append("success_url", opts.success_url);
    if (opts?.cancel_url) form.append("cancel_url", opts.cancel_url);
    const res = await privateApi.post(`/user/api-escrow-action/escrow/payment/approval-submit/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/api-escrow-action/approval-pending/manual/confirm — action-flow manual proof. */
  async approvalManualConfirm({ trx, fields }: { trx: string; fields: Record<string, any> }) {
    const form = new FormData();
    form.append("trx", trx);
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof File !== "undefined" && value instanceof File) form.append(key, value);
      else form.append(key, String(value));
    });
    const res = await privateApi.post("/user/api-escrow-action/approval-pending/manual/confirm", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /api-escrow-action/authorize-payment-submit — action-flow card payment. */
  async approvalAuthorize(payload: { trx: string; card_number: string; date: string; code: string }) {
    const form = new FormData();
    form.append("trx", payload.trx);
    form.append("card_number", payload.card_number);
    form.append("date", payload.date);
    form.append("code", payload.code);
    const res = await privateApi.post("/api-escrow-action/authorize-payment-submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /user/my-escrow/manual/payment/confirmed — submit manual-gateway proof. */
  async manualPaymentConfirm({ trx, fields }: { trx: string; fields: Record<string, any> }) {
    const form = new FormData();
    form.append("trx", trx);
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof File !== "undefined" && value instanceof File) form.append(key, value);
      else form.append(key, String(value));
    });
    const res = await privateApi.post("/user/my-escrow/manual/payment/confirmed", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /my-escrow/authorize-payment-submit — pay an Authorize (card) escrow. */
  async authorizePayment(payload: { trx: string; card_number: string; date: string; code: string }) {
    const form = new FormData();
    form.append("trx", payload.trx);
    form.append("card_number", payload.card_number);
    form.append("date", payload.date);
    form.append("code", payload.code);
    const res = await privateApi.post("/my-escrow/authorize-payment-submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default escrowService;
