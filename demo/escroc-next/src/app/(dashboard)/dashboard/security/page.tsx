import { Security } from "@/components/dashboard/page/security/Security";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "2FA Security — Escroc" };

export default function SecurityPage() {
  return (
    <div className={dsx.page}>
      <Security />
    </div>
  );
}
