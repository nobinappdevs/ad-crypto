import { publicApi } from "@/lib/axios";

/**
 * One row of the backend's own country table. `mobile_code` is not always a bare
 * dial code — the table carries "+358-18" and "1-242" — and it is kept verbatim,
 * since normalising it would write back a value the backend never gave us.
 */
export interface Country {
  id?: number;
  name?: string;
  mobile_code?: string;
  currency_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  /** ISO 3166-1 alpha-2 — what the flag emoji is built from. */
  iso2?: string;
}

export const countryService = {
  /** GET /country-list — public; no token needed. */
  async list(): Promise<{ data?: { countries?: Country[] } }> {
    const res = await publicApi.get("/country-list");
    return res.data;
  },
};

export default countryService;
