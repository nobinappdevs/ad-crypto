"use client";

import { useEffect } from "react";
import { ShieldCheck, LayoutDashboard, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentResultView } from "@/components/dashboard/PaymentResult";

/**
 * Landing page the hosted (WEB) gateway redirects the browser back to after an
 * escrow payment completes or is aborted. The URL path decides the variant.
 */
export function EscrowResult({ variant }: { variant: "success" | "cancel" }) {
  const qc = useQueryClient();
  const isSuccess = variant === "success";

  // A funded escrow changes the escrow list + wallet/dashboard — refresh them.
  useEffect(() => {
    if (isSuccess) {
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    }
  }, [isSuccess, qc]);

  return isSuccess ? (
    <PaymentResultView
      variant="success"
      titleKey="dashboard.createEscrow.resultSuccessTitle"
      descKey="dashboard.createEscrow.resultSuccessDesc"
      primary={{ href: "/dashboard/escrow", labelKey: "dashboard.createEscrow.resultMyEscrow", icon: <ShieldCheck size={16} strokeWidth={2.5} aria-hidden /> }}
      secondary={{ href: "/dashboard", labelKey: "dashboard.createEscrow.resultDashboard", icon: <LayoutDashboard size={16} strokeWidth={2} aria-hidden /> }}
    />
  ) : (
    <PaymentResultView
      variant="cancel"
      titleKey="dashboard.createEscrow.resultCancelTitle"
      descKey="dashboard.createEscrow.resultCancelDesc"
      primary={{ href: "/dashboard/create-escrow", labelKey: "dashboard.createEscrow.resultBack", icon: <Plus size={16} strokeWidth={2.5} aria-hidden /> }}
      secondary={{ href: "/dashboard/escrow", labelKey: "dashboard.createEscrow.resultMyEscrow", icon: <ShieldCheck size={16} strokeWidth={2} aria-hidden /> }}
    />
  );
}
