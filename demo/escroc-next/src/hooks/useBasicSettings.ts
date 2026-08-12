"use client";

import { useQuery } from "@tanstack/react-query";
import { basicService, type PusherBroadcastConfig } from "@/services/basic.service";
import { dashboardService } from "@/services/dashboard.service";
import { env } from "@/config/env";

/** GET /basic/settings — public site settings (cached; rarely changes). */
export function useBasicSettings() {
  return useQuery({
    queryKey: ["basic-settings"],
    queryFn: () => basicService.getSettings(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Convenience selector for the Google reCAPTCHA config.
 * `enabled` is true only when the backend has it switched on (status === "1")
 * and a site key is present — so forms can gate on a single flag.
 */
export function useRecaptcha() {
  const { data } = useBasicSettings();
  const creds = (data as any)?.data?.google_recaptcha_credentials;
  const siteKey: string = creds?.site_key ?? "";
  const enabled = String(creds?.status) === "1" && !!siteKey;
  return { enabled, siteKey };
}

/**
 * Whether the admin has signups switched on (`all_logo.user_registration`).
 * Defaults to allowed while the settings request is still in flight — only an
 * explicit `0` from the backend closes registration, so a slow/failed fetch
 * never locks people out of the form.
 */
export function useRegistrationEnabled() {
  const { data, isLoading } = useBasicSettings();
  const flag = data?.data?.all_logo?.user_registration;
  return { enabled: String(flag ?? 1) !== "0", isLoading };
}

/**
 * Pusher **Channels** config for the escrow chat, resolved at runtime.
 *
 * Source order:
 *   1. `.env` overrides (local testing only — normally empty)
 *   2. `/basic/settings → pusher_broadcast_config`   ← preferred: public + cached app-wide
 *   3. `/user/dashboard → pusher_broadcast_config`   ← where the backend puts it today
 *
 * The dashboard fallback reuses the `["dashboard"]` query key, so it costs
 * nothing when that data is already cached, and is skipped entirely once the
 * settings endpoint starts carrying the config.
 */
export function usePusherBroadcastConfig() {
  const { data: settings, isLoading: settingsLoading } = useBasicSettings();
  const fromSettings: PusherBroadcastConfig | undefined =
    settings?.data?.pusher_broadcast_config;

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboard(),
    enabled: !settingsLoading && !fromSettings,
    staleTime: 5 * 60 * 1000,
  });

  const cfg: PusherBroadcastConfig =
    fromSettings ?? (dash as any)?.data?.pusher_broadcast_config ?? {};

  const key = env.pusherKey || cfg.primary_key || "";
  const cluster = env.pusherCluster || cfg.cluster || "";
  const channelTemplate = env.pusherConversationChannel || cfg.channel || "";
  const event = env.pusherConversationEvent || cfg.event || "";

  return {
    key,
    cluster,
    channelTemplate,
    event,
    /** Everything needed to open a subscription is present. */
    ready: Boolean(key && cluster && channelTemplate),
    isLoading: settingsLoading || dashLoading,
  };
}
