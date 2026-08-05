"use client";

import { useQuery } from "@tanstack/react-query";
import { basicService } from "@/services/basic.service";

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
