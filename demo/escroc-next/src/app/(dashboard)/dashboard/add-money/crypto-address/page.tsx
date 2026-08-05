import { Suspense } from "react";
import { AddMoneyCryptoAddress } from "@/components/dashboard/page/add-money/AddMoneyCryptoAddress";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Crypto Payment — Escroc" };

export default function AddMoneyCryptoAddressPage() {
  return (
    <div className={dsx.page}>
      <Suspense>
        <AddMoneyCryptoAddress />
      </Suspense>
    </div>
  );
}
