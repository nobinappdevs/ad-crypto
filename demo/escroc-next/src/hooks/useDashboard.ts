"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

/** GET /user/dashboard — escrow stats, user, wallets + recent transactions. */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboard(),
  });
}
