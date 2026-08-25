import { PageHeader } from "@/components/share/PageHeader";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { PRIVACY } from "@/config/legal";

export const metadata = {
  title: "Privacy Policy — AdCrypto",
  description: "What AdCrypto collects, why, and what you can ask us to do with it.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader titleKey="footer.columns.about.items.privacy" />
      <LegalDoc doc={PRIVACY} />
    </>
  );
}
