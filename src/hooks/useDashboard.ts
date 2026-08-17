"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService, type DashboardData } from "@/services/dashboard.service";

export const DASHBOARD_KEY = ["dashboard"] as const;

/**
 * GET /user/dashboard — everything the overview draws, in one request.
 *
 * Balances move whenever a trade settles, so this is refetched on focus rather
 * than trusted for the session: coming back to the tab after buying elsewhere in
 * the app should not show the old figure.
 */
export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => dashboardService.get(),
    enabled,
    refetchOnWindowFocus: true,
    select: (res): DashboardData => res?.data ?? {},
  });
}
