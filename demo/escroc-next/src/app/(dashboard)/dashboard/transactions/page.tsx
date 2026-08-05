import { Transaction } from "@/components/dashboard/page/transaction/Transaction";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Transactions — Escroc" };

export default function TransactionsPage() {
  return (
    <div className={dsx.page}>
      <Transaction />
    </div>
  );
}
