import { Suspense } from "react";
import { EscrowPay } from "@/components/dashboard/page/escrow/EscrowPay";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Escrow Payment — Escroc" };

export default function EscrowPayPage() {
  return (
    <div className={dsx.page}>
      <Suspense fallback={null}>
        <EscrowPay />
      </Suspense>
    </div>
  );
}
