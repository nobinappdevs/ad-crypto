import { Suspense } from "react";
import { EscrowCryptoAddress } from "@/components/dashboard/page/escrow/EscrowCryptoAddress";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Crypto Payment — Escroc" };

export default function EscrowCryptoAddressPage() {
  return (
    <div className={dsx.page}>
      <Suspense>
        <EscrowCryptoAddress />
      </Suspense>
    </div>
  );
}
