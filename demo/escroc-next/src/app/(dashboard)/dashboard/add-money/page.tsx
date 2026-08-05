import { AddMoney } from "@/components/dashboard/page/add-money/AddMoney";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Add Money — Escroc" };

export default function AddMoneyPage() {
  return (
    <div className={dsx.page}>
      <AddMoney />
    </div>
  );
}
