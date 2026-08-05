import { AddMoneyResult } from "@/components/dashboard/page/add-money/AddMoneyResult";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Payment Successful — Escroc" };

export default function AddMoneySuccessPage() {
  return (
    <div className={dsx.page}>
      <AddMoneyResult variant="success" />
    </div>
  );
}
