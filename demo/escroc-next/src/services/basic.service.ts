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

/** The `all_logo` block — site identity plus a couple of global switches. */
export interface AllLogo {
  site_name?: string;
  site_title?: string;
  site_logo_dark?: string;
  site_logo?: string;
  site_fav_dark?: string;
  site_fav?: string;
  base_color?: string;
  timezone?: string;
  frontend_mode?: boolean;
  /** 1 = signups open, 0 = signups closed by the admin. */
  user_registration?: number | string;
  [key: string]: unknown;
}

/**
 * Pusher **Channels** config for realtime chat (not Beams — that is web push).
 * Served by the backend so credentials are never baked into the static bundle.
 *
 * `channel` is a template: `{escrow_id}` is substituted at subscribe time.
 *
 * Only `primary_key` (the PUBLIC app key) and `cluster` are usable in a
 * browser. `app_id` and `secret_key` are server-side secrets that should never
 * be sent to a client — they are typed here only because the current API
 * includes them, and they are deliberately never read.
 */
export interface PusherBroadcastConfig {
  method?: string;
  primary_key?: string;
  cluster?: string;
  /** e.g. "escrow.conversation.{escrow_id}" — prefix `private-` for authed channels. */
  channel?: string;
  /** e.g. "escrow.conversation" */
  event?: string;
}

export interface BasicSettings {
  asset_base_url?: string;
  default_logo?: string;
  logo_image_path?: string;
  image_path?: string;
  web_links?: Record<string, string>;
  all_logo?: AllLogo;
  web_app?: boolean;
  google_recaptcha_credentials?: RecaptchaCredentials;
  tawk_to_credentials?: TawkToCredentials;
  pusher_broadcast_config?: PusherBroadcastConfig;
}

export const basicService = {
  /** GET /basic/settings — public site settings (recaptcha, logos, links, chat…). */
  async getSettings(): Promise<{ data: BasicSettings }> {
    const res = await publicApi.get("/basic/settings");
    return res.data;
  },
};

export default basicService;
