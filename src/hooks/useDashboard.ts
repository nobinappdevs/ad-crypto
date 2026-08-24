"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService, type DashboardData } from "@/services/dashboard.service";

export const DASHBOARD_KEY = ["dashboard"] as const;

/**
 * How often the guards re-ask while a gate is what they are waiting on.
 *
 * The verification flags are account columns an operator edits, and nothing tells
 * the browser when that happens — so a session held on a verify screen, or one
 * inside the dashboard whose access has just been revoked, only notices on the
 * next request. Without a poll that meant a manual reload, which is not something
 * a user waiting to be let in knows to do.
 *
 * 15 seconds because it is the difference between "it works" and "it looks
 * broken", and because these are the only two places that ask for it: the polling
 * stops the moment the gate is settled and the guard drops the interval.
 */
export const GATE_POLL_MS = 15_000;

/**
 * GET /user/dashboard — everything the overview draws, in one request.
 *
 * Balances move whenever a trade settles, so this is refetched on focus rather
 * than trusted for the session: coming back to the tab after buying elsewhere in
 * the app should not show the old figure.
 *
 * The guards subscribe to this same query, because the payload also carries the
 * account's verification flags and is the only endpoint that does. Several
 * callers, one request — the query key is shared, and only the guards pass a
 * `refetchInterval`, so the overview page does not poll on their behalf.
 */
export function useDashboard(
  enabled = true,
  options?: { refetchInterval?: number; refetchOnMount?: boolean | "always" },
) {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => dashboardService.get(),
    enabled,
    refetchOnWindowFocus: true,
    // Both left undefined by everything except the guards, which need an answer
    // from the server rather than from the cache. A hidden tab does not poll:
    // `refetchIntervalInBackground` stays off, so a background tab catches up on
    // focus instead of holding a timer open.
    refetchInterval: options?.refetchInterval,
    refetchOnMount: options?.refetchOnMount,
    select: (res): DashboardData => res?.data ?? {},
  });
}
