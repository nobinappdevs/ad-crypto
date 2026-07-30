import { PageHeader } from "@/components/share/PageHeader";
import { Services } from "@/components/homepage/Services";

export const metadata = {
  title: "Service — AdCrypto",
  description: "The services AdCrypto offers across wallets, trading and settlement.",
};

export default function ServicePage() {
  return (
    <>
      <PageHeader titleKey="nav.service" />
      <Services />
    </>
  );
}
