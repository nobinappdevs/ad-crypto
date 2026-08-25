import { CardCustomer } from "@/components/dashboard/page/CardCustomer";

export const metadata = {
  title: "Create Card Customer — AdCrypto",
};

/**
 * A virtual card needs a verified card customer first, so the section opens on that
 * application. Once issuing is wired up this page shows the cards instead.
 */
export default function MyCardsPage() {
  return <CardCustomer />;
}
