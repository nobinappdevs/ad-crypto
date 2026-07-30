import { PageHeader } from "@/components/share/PageHeader";
import { WebJournal } from "@/components/homepage/WebJournal";

export const metadata = {
  title: "Web Journal — AdCrypto",
  description: "Updates, notes and product news from the AdCrypto team.",
};

export default function WebJournalPage() {
  return (
    <>
      <PageHeader titleKey="nav.webJournal" />
      <WebJournal />
    </>
  );
}
