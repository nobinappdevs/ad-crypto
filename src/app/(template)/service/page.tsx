import { PageHeader } from "@/components/share/PageHeader";
import { Services } from "@/components/homepage/Services";
import { SecuritySystem } from "@/components/homepage/SecuritySystem";

export const metadata = {
  title: "Service — AdCrypto",
  description: "The services AdCrypto offers across wallets, trading and settlement.",
};

export default function ServicePage() {
  return (
    <>
      <PageHeader titleKey="nav.service" />
      {/* <Services /> */}
      {/* The eight-layer grid: it reads as part of the service catalogue, and the
          home page now carries the sticky-scroll version of the same content. */}
      <SecuritySystem />
    </>
  );
}
