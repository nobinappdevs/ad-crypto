import { privateApi } from "@/lib/axios";

/**
 * One control in the KYC form, exactly as the backend describes it. The form is
 * operator-configurable, so the field list is data and the page renders what it is
 * handed — hence everything but the field's identity being optional.
 */
export interface KycField {
  /** "file" | "select" | "text" | "textarea" | "date" | … — drives the control. */
  type: string;
  /** The operator's own wording. NOT a translation key — shown verbatim. */
  label: string;
  /** The form-data key to submit under. */
  name: string;
  required?: boolean;
  validation?: {
    /** Files: size ceiling in MEGABYTES, as a string ("2"). Text: max length. */
    max?: string | number;
    /** Text: minimum length. Sent as 0 when it doesn't apply. */
    min?: string | number;
    /** Files: accepted extensions, e.g. ["jpg","png","webp","jpeg"]. */
    mimes?: string[];
    /** Selects: the allowed values. May arrive with stray leading spaces. */
    options?: string[];
    required?: boolean;
  };
}

/** 0 Unverified, 1 Verified, 2 Pending review, 3 Rejected. */
export type KycStatus = 0 | 1 | 2 | 3;

export interface KycData {
  /** The backend's own legend for `kyc_status`, e.g. "0: Unverified, …". */
  status_info?: string;
  kyc_status?: KycStatus;
  input_fields?: KycField[];
}

/** A field's value: text and selects are strings, uploads are files. */
export type KycValue = string | File | null;

export const kycService = {
  /** GET /user/profile/kyc/input-fields — current status + the form to render. */
  async getFields(): Promise<{ data?: KycData }> {
    const res = await privateApi.get("/user/profile/kyc/input-fields");
    return res.data;
  },

  /**
   * POST /user/profile/kyc/submit — multipart, since the scans are part of the same
   * submission. Empty values are dropped rather than sent as "".
   */
  async submit(values: Record<string, KycValue>) {
    const form = new FormData();
    for (const [name, value] of Object.entries(values)) {
      if (value === null || value === undefined || value === "") continue;
      form.append(name, value instanceof File ? value : String(value));
    }
    const res = await privateApi.post("/user/profile/kyc/submit", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default kycService;
