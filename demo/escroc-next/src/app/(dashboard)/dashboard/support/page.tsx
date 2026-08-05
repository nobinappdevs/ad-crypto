import { Support } from "@/components/dashboard/page/support/Support";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "Support Tickets — Escroc" };

export default function SupportPage() {
  return (
    <div className={dsx.page}>
      <Support />
    </div>
  );
}
