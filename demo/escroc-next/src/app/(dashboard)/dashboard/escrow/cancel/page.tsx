import { EscrowResult } from "@/components/dashboard/page/escrow/EscrowResult";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Payment Canceled — Escroc" };

export default function EscrowCancelPage() {
  return (
    <div className={dsx.page}>
      <EscrowResult variant="cancel" />
    </div>
  );
}
