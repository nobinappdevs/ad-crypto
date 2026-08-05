import { MyEscrow } from "@/components/dashboard/page/escrow/MyEscrow";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "My Escrow — Escroc" };

export default function EscrowPage() {
  return (
    <div className={dsx.page}>
      <MyEscrow />
    </div>
  );
}
