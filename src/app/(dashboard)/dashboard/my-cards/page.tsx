import { CardCustomer } from "@/components/dashboard/page/CardCustomer";

export const metadata = {
  title: "Create Card Customer — AdCrypto",
};

/**
 * A virtual card needs a verified card customer before it can be issued, so the
 * section opens on that application. Once the issuing API is wired up this page
 * shows the customer's cards instead and the form moves behind a "new card" step.
 */
export default function MyCardsPage() {
  return <CardCustomer />;
}
