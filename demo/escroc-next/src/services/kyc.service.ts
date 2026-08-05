import { privateApi } from "@/lib/axios";

export interface KycField {
  type: string;
  label: string;
  name: string;
  required: boolean;
  validation: {
    max?: any;
    min?: any;
    mimes?: string[];
    options?: string[];
    required?: boolean;
  };
}

export interface KycData {
  status_info: string;
  kyc_status: number; // 0 Unverified, 1 Verified, 2 Pending, 3 Rejected
  input_fields: KycField[];
}

export const kycService = {
  /** GET /user/kyc/input-fields — status + dynamic KYC form fields. */
  async getFields(): Promise<{ data: KycData }> {
    const res = await privateApi.get("/user/kyc/input-fields");
    return res.data;
  },

  /** POST /user/kyc/submit — form-data (files included). */
  async submit(fields: Record<string, any>) {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (typeof File !== "undefined" && value instanceof File) form.append(key, value);
      else form.append(key, String(value));
    });
    const res = await privateApi.post("/user/kyc/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default kycService;
