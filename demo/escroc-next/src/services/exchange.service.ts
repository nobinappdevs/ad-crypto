import { privateApi } from "@/lib/axios";

export interface ExchangeWallet {
  name: string;
  balance: number;
  currency_code: string;
  currency_symbol: string;
  currency_type: string;
  rate: number;
  flag: string;
  image_path: string;
}

export interface ExchangeCharges {
  title: string;
  fixed_charge: number;
  percent_charge: number;
  min_limit: number;
  max_limit: number;
  currency_code: string;
  currency_symbol: string;
}

export interface ExchangeTransaction {
  id: number;
  trx_id: string;
  transaction_type: string;
  sender_request_amount: number;
  sender_currency_code: string;
  total_payable: string;
  exchange_rate: number;
  fee: number;
  created_at: string;
}

export interface MoneyExchangeData {
  userWallet: ExchangeWallet[];
  charges: ExchangeCharges;
  transactionss: ExchangeTransaction[];
  base_url: string;
}

export interface ExchangeSubmitPayload {
  exchange_from_amount: number;
  exchange_from_currency: string;
  exchange_to_amount?: number;
  exchange_to_currency: string;
}

export const exchangeService = {
  /** GET /user/money-exchange — wallets, rates, charges + history. Requires auth. */
  async getInfo(): Promise<{ data: MoneyExchangeData }> {
    const res = await privateApi.get("/user/money-exchange");
    return res.data;
  },

  /** POST /user/money-exchange/submit — performs an exchange. Form-data. */
  async submit(payload: ExchangeSubmitPayload) {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") form.append(key, String(value));
    });
    const res = await privateApi.post("/user/money-exchange/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default exchangeService;
