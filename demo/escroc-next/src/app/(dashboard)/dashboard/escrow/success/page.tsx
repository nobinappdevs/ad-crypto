import { EscrowResult } from "@/components/dashboard/page/escrow/EscrowResult";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Payment Successful — Escroc" };

export default function EscrowSuccessPage() {
  return (
    <div className={dsx.page}>
      <EscrowResult variant="success" />
    </div>
  );
}
