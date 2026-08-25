"use client";

import { useQuery } from "@tanstack/react-query";
import { basicService, type BasicSettingsData } from "@/services/basic.service";

export const BASIC_SETTINGS_KEY = ["basic-settings"] as const;

/**
 * GET /basic-settings — the operator's switches.
 *
 * Deliberately never treated as fresh. These values exist to be changed from the
 * admin panel, and nothing tells a browser when that happens — held for even a few
 * minutes, a switch flipped upstream stayed invisible until someone thought to
 * hard-reload, which is not a thing users do.
 *
 * So `staleTime: 0` with `refetchOnMount: "always"`: arriving at a screen that
 * asks for these settings asks the server, every time, however the user got there.
 * The cached copy still paints instantly while that request is in flight — this is
 * "always re-ask", not "always wait" — and the answer replaces it when it lands.
 * The endpoint is public and small, so the cost of asking is the right trade for
 * never being wrong about it.
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
 * Whether the admin has signups switched on (`basic_settings.user_registration`).
 *
 * Only an explicit `0` closes the form. A request still in flight, a failed one,
 * or a payload without the field all leave it open: the endpoint decides who may
 * register, and the API rejects the POST anyway — locking people out of a form
 * because a settings request timed out would be our own outage, not the admin's
 * decision.
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
 * Whether the sign-up form has to ask for the terms checkbox
 * (`basic_settings.agree_policy`). Absent means yes: asking for consent that is
 * not required is harmless, skipping consent that is required is not.
 */
export function usePolicyRequired() {
  const { data } = useBasicSettings();
  const flag = data?.basic_settings?.agree_policy;
  return flag === undefined || flag === null ? true : String(flag) !== "0";
}
