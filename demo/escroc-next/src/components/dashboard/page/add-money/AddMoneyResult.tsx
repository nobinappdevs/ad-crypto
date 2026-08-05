"use client";

import { useEffect } from "react";
import { Wallet, LayoutDashboard, Receipt } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentResultView } from "@/components/dashboard/PaymentResult";

/**
 * Landing page the hosted (WEB) gateway redirects the browser back to after a
 * deposit completes or is aborted. The URL path — not a query param — decides
 * which variant renders, so it works even when the gateway sends no extra data.
 */
export function AddMoneyResult({ variant }: { variant: "success" | "cancel" }) {
  const qc = useQueryClient();
  const isSuccess = variant === "success";

  // A completed deposit changes the wallet balance + deposit history — drop the
  // cached add-money/dashboard data so it refetches when the user navigates back.
  useEffect(() => {
    if (isSuccess) {
      qc.invalidateQueries({ queryKey: ["add-money"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    }
  }, [isSuccess, qc]);

  return isSuccess ? (
    <PaymentResultView
      variant="success"
      titleKey="dashboard.addMoney.resultSuccessTitle"
      descKey="dashboard.addMoney.resultSuccessDesc"
      primary={{ href: "/dashboard", labelKey: "dashboard.addMoney.resultDashboard", icon: <LayoutDashboard size={16} strokeWidth={2.5} aria-hidden /> }}
      secondary={{ href: "/dashboard/transactions", labelKey: "dashboard.addMoney.resultTransactions", icon: <Receipt size={16} strokeWidth={2} aria-hidden /> }}
    />
  ) : (
    <PaymentResultView
      variant="cancel"
      titleKey="dashboard.addMoney.resultCancelTitle"
      descKey="dashboard.addMoney.resultCancelDesc"
      primary={{ href: "/dashboard/add-money", labelKey: "dashboard.addMoney.resultBack", icon: <Wallet size={16} strokeWidth={2.5} aria-hidden /> }}
      secondary={{ href: "/dashboard", labelKey: "dashboard.addMoney.resultDashboard", icon: <LayoutDashboard size={16} strokeWidth={2} aria-hidden /> }}
    />
  );
}
