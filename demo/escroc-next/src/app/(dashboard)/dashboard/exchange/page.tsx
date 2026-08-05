import { Exchange } from "@/components/dashboard/page/exchange/Exchange";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Exchange — Escroc" };

export default function ExchangePage() {
  return (
    <div className={dsx.page}>
      <Exchange />
    </div>
  );
}
