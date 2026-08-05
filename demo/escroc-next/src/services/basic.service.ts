import { publicApi } from "@/lib/axios";

export interface RecaptchaCredentials {
  status: string; // "1" enabled | "0" disabled
  site_key: string;
}

export interface TawkToCredentials {
  status: string;
  property_id: string;
  widget_id: string;
}

export interface BasicSettings {
  asset_base_url?: string;
  default_logo?: string;
  logo_image_path?: string;
  image_path?: string;
  web_links?: Record<string, string>;
  all_logo?: Record<string, string>;
  web_app?: boolean;
  google_recaptcha_credentials?: RecaptchaCredentials;
  tawk_to_credentials?: TawkToCredentials;
}

export const basicService = {
  /** GET /basic/settings — public site settings (recaptcha, logos, links, chat…). */
  async getSettings(): Promise<{ data: BasicSettings }> {
    const res = await publicApi.get("/basic/settings");
    return res.data;
  },
};

export default basicService;
