import { PageHeader } from "@/components/share/PageHeader";
import { Container } from "@/components/share/Container";
import { AboutStory } from "@/components/about/AboutStory";
import { AboutFaq } from "@/components/about/AboutFaq";

export const metadata = {
  title: "About — AdCrypto",
  description: "Learn what AdCrypto is building and why.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader titleKey="nav.about" />
      <section
        className="pt-10 pb-16 sm:pt-14 sm:pb-20 xl:pb-22.5"
      >
        <Container className="flex flex-col gap-7.5">
          <AboutStory />
          <AboutFaq />
        </Container>
      </section>
    </>
  );
}
