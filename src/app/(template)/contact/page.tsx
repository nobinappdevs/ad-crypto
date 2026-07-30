import { PageHeader } from "@/components/share/PageHeader";
import { Contact } from "@/components/homepage/Contact";

export const metadata = {
  title: "Contact — AdCrypto",
  description: "Get in touch with the AdCrypto team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader titleKey="nav.contact" />
      <Contact />
    </>
  );
}
