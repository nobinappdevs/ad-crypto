import { PageHeader } from "@/components/share/PageHeader";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { TERMS } from "@/config/legal";

export const metadata = {
  title: "Terms of Use — AdCrypto",
  description: "The terms you agree to when you use AdCrypto.",
};

export default function TermsPage() {
  // The title rides the string the footer already links it by, so it stays
  // translated in every language the site ships.
  return (
    <>
      <PageHeader titleKey="footer.columns.about.items.terms" />
      <LegalDoc doc={TERMS} />
    </>
  );
}
