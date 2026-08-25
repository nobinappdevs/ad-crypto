"use client";

import { useQuery } from "@tanstack/react-query";
import { basicService, type BasicSettingsData } from "@/services/basic.service";

export const BASIC_SETTINGS_KEY = ["basic-settings"] as const;

/**
 * GET /basic-settings — the operator's switches.
 *
 * Never treated as fresh: these change from the admin panel and nothing tells a
 * browser when. `staleTime: 0` with `refetchOnMount: "always"` means every screen
 * re-asks — the cached copy still paints while it does, so this is "always re-ask",
 * not "always wait".
 */
export function useBasicSettings(enabled = true) {
  return useQuery({
    queryKey: BASIC_SETTINGS_KEY,
    queryFn: () => basicService.get(),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: (res): BasicSettingsData => res?.data ?? {},
  });
}

/**
 * Whether signups are on (`basic_settings.user_registration`). Only an explicit `0`
 * closes the form — a failed or in-flight settings request must not lock anyone out.
 */
export function useRegistrationOpen() {
  const { data, isPending } = useBasicSettings();
  const flag = data?.basic_settings?.user_registration;

  return {
    open: flag === undefined || flag === null ? true : String(flag) !== "0",
    /** True while the answer is still unknown — the form can wait for it. */
    isPending,
  };
}

/**
 * Whether the sign-up form asks for the terms checkbox (`agree_policy`). Absent
 * means yes: asking for consent that is not required is the harmless direction.
 */
export function usePolicyRequired() {
  const { data } = useBasicSettings();
  const flag = data?.basic_settings?.agree_policy;
  return flag === undefined || flag === null ? true : String(flag) !== "0";
}
