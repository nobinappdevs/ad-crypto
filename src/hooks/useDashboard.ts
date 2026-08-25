"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService, type DashboardData } from "@/services/dashboard.service";

export const DASHBOARD_KEY = ["dashboard"] as const;

/**
 * GET /user/dashboard — everything the overview draws, and the only endpoint that
 * carries the account's verification flags.
 *
 * Asked for when a screen that needs it mounts, and when the tab is focused or the
 * connection comes back. There is no timer: nothing here polls.
 *
 * The guards use the same query key, so entering the dashboard costs ONE request
 * that both the gate check and the overview read. Moving between dashboard pages
 * afterwards costs nothing — the layout the guard lives in stays mounted, and the
 * flags it already has are the ones a second call would return.
 */
export function useDashboard(enabled = true, options?: { refetchOnMount?: boolean | "always" }) {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => dashboardService.get(),
    enabled,
    // Never held as fresh: balances move whenever a trade settles, and the flags
    // move whenever an operator edits them.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // "always" from the guards, so entering the dashboard asks the server rather
    // than trusting a copy left over from the last visit.
    refetchOnMount: options?.refetchOnMount,
    select: (res): DashboardData => res?.data ?? {},
  });
}
