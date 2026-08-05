import { MoneyOut } from "@/components/dashboard/page/money-out/MoneyOut";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Money Out — Escroc" };

export default function MoneyOutPage() {
  return (
    <div className={dsx.page}>
      <MoneyOut />
    </div>
  );
}
