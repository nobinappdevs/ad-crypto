import { privateApi } from "@/lib/axios";

export interface MoWallet {
  name: string;
  balance: number;
  currency_code: string;
  currency_symbol: string;
  currency_type: string;
  rate: number;
  flag: string;
  image_path: string;
}

export interface GatewayCurrency {
  id: number;
  payment_gateway_id: number;
  type: string;
  name: string;
  alias: string;
  currency_code: string;
  currency_symbol: string;
  image: string | null;
  min_limit: number;
  max_limit: number;
  percent_charge: number;
  fixed_charge: number;
  rate: number;
}

export interface MoTransaction {
  id: number;
  trx_id: string;
  gateway_currency: string;
  transaction_type: string;
  sender_request_amount: number;
  sender_currency_code: string;
  total_payable: string;
  gateway_currency_code: string;
  exchange_rate: number;
  fee: number;
  rejection_reason: string | null;
  created_at: string;
}

export interface MoneyOutData {
  base_curr: string;
  base_curr_rate: string;
  default_image: string;
  image_path: string;
  base_url: string;
  userWallet: MoWallet[];
  gatewayCurrencies: GatewayCurrency[];
  transactionss: MoTransaction[];
}

/** A dynamic field the API asks us to render on the step-2 withdraw form. */
export interface MoInputField {
  type: string; // select | text | number | file | textarea | ...
  name: string;
  label: string;
  required: boolean;
  place_holder: string;
  options: any[];
}

export interface MoneyOutSubmitData {
  payment_information: Record<string, string>;
  gateway_type: string;
  gateway_currency_name: string;
  gateway_currency_code: string;
  branch_available: boolean;
  alias: string;
  input_fields: MoInputField[];
}

export interface MoneyOutSubmitPayload {
  gateway_currency: string; // gateway alias
  sender_currency: string;  // wallet currency code
  amount: number;
}

export interface BankInfo {
  id: number;
  code: string;
  name: string;
}

export interface BankBranch {
  id: number;
  branch_code: string;
  branch_name: string;
  swift_code: string | null;
  bic: string | null;
  bank_id: number;
}

export const moneyOutService = {
  /** GET /user/money-out/index — wallets, gateways, charges + history. Requires auth. */
  async getInfo(): Promise<{ data: MoneyOutData }> {
    const res = await privateApi.get("/user/money-out/index");
    return res.data;
  },

  /** POST /user/money-out/submit — step 1: returns the dynamic withdraw fields. */
  async submit(payload: MoneyOutSubmitPayload): Promise<{ data: MoneyOutSubmitData }> {
    const form = new FormData();
    form.append("gateway_currency", payload.gateway_currency);
    form.append("sender_currency", payload.sender_currency);
    form.append("amount", String(payload.amount));
    const res = await privateApi.post("/user/money-out/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** GET /user/money-out/get/flutterwave/banks — bank list for Flutterwave gateways. */
  async getFlutterwaveBanks(trx: string): Promise<{ data: { bank_info: BankInfo[] } }> {
    const res = await privateApi.get(`/user/money-out/get/flutterwave/banks?trx=${encodeURIComponent(trx)}`);
    return res.data;
  },

  /** GET /user/money-out/get/flutterwave/bank/branches — branch list for a chosen bank. */
  async getFlutterwaveBranches(trx: string, bankId: string | number): Promise<{ data: { bank_branches: BankBranch[] } }> {
    const res = await privateApi.get(
      `/user/money-out/get/flutterwave/bank/branches?trx=${encodeURIComponent(trx)}&bank_id=${encodeURIComponent(String(bankId))}`,
    );
    return res.data;
  },

  /**
   * POST step 2: finalize the withdraw. Routes to automatic/manual based on the
   * gateway type. Sends `trx` + the dynamic field values (files included).
   */
  async confirm({ gatewayType, trx, fields }: { gatewayType: string; trx: string; fields: Record<string, any> }) {
    const form = new FormData();
    form.append("trx", trx);
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof File !== "undefined" && value instanceof File) form.append(key, value);
      else form.append(key, String(value));
    });
    const path = gatewayType === "AUTOMATIC" ? "automatic" : "manual";
    const res = await privateApi.post(`/user/money-out/${path}/confirmed`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default moneyOutService;
