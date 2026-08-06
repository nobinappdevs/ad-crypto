import { PageHeader } from "@/components/share/PageHeader";
import { SecuritySystem } from "@/components/homepage/SecuritySystem";

export const metadata = {
  title: "Service — AdCrypto",
  description: "The services AdCrypto offers across wallets, trading and settlement.",
};

export default function ServicePage() {
  return (
    <>
      <PageHeader titleKey="nav.service" />
      {/* The eight-layer grid: it reads as part of the service catalogue, and the
          home page now carries the sticky-scroll version of the same content. The
          older `Services` card grid is superseded by it and stays off this page. */}
      <SecuritySystem />
    </>
  );
}
