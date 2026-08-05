import { AddMoneyResult } from "@/components/dashboard/page/add-money/AddMoneyResult";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Payment Canceled — Escroc" };

export default function AddMoneyCancelPage() {
  return (
    <div className={dsx.page}>
      <AddMoneyResult variant="cancel" />
    </div>
  );
}
