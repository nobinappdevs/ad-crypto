import { publicApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";

/**
 * `GET /basic-settings` — the operator's switches, and the only place the front end
 * can learn them. Anything gated on one has to ASK: a build-time constant or a value
 * mirrored at login goes stale the moment the admin changes it.
 */

export interface SiteSettings {
  id?: number;
  site_name?: string;
  site_title?: string;
  timezone?: string;
  site_logo?: string;
  site_logo_dark?: string;
  site_fav?: string;
  site_fav_dark?: string;
  /** 1 = signups open, 0 = the admin has closed registration. */
  user_registration?: number | string;
  /** 1 = the terms checkbox is required at sign-up. */
  agree_policy?: number | string;
}

export interface RecaptchaSettings {
  status?: number | string;
  site_key?: string;
}

export interface BasicSettingsData {
  basic_settings?: SiteSettings;
  privacy_policy_link?: string;
  about_page_link?: string;
  contact_page_link?: string;
  google?: { recaptcha?: RecaptchaSettings };
  basic_image_path?: ImagePaths;
}

export const basicService = {
  /** GET /basic-settings — no token: the login and register screens need it too. */
  async get(): Promise<{ data?: BasicSettingsData }> {
    const res = await publicApi.get("/basic-settings");
    return res.data;
  },
};

export default basicService;
