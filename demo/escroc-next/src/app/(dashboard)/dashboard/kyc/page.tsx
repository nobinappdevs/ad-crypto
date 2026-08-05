import { Kyc } from "@/components/dashboard/page/kyc/Kyc";
import { dsx } from "@/components/dashboard/ui";

export const metadata = { title: "KYC Verification — Escroc" };

export default function KycPage() {
  return (
    <div className={dsx.page}>
      <Kyc />
    </div>
  );
}
