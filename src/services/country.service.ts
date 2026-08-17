import { publicApi } from "@/lib/axios";

/**
 * One row of the backend's own country table.
 *
 * `mobile_code` is NOT always a bare dial code — the table carries entries like
 * "+358-18" (Åland) and "1-242" (Bahamas), i.e. a code with its area prefix. It is
 * stored and returned verbatim, so it is kept verbatim here too: normalising it
 * would mean writing back a value the backend never gave us.
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
