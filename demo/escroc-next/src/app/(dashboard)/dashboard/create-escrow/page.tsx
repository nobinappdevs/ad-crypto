import { Suspense } from "react";
import { CreateEscrow } from "@/components/dashboard/page/escrow/CreateEscrow";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Create Escrow — Escroc" };

export default function CreateEscrowPage() {
  return (
    <div className={dsx.page}>
      <Suspense>
        <CreateEscrow />
      </Suspense>
    </div>
  );
}
