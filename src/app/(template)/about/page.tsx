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
      {/* About was the only public page opening straight into its content, so it
          also had to carry its own top padding to clear the fixed nav. The shared
          banner does both, and titles the page the way Service, Web Journal and
          Contact are titled. */}
      <PageHeader titleKey="nav.about" />

      {/* `Container`, not a bespoke max-width: the story and the FAQ now measure
          from the same shell as every other page, so their edges line up. */}
      <section
        className="pt-10 pb-16 sm:pt-14 sm:pb-20 xl:pb-22.5"
        // style={{ background: "var(--suite-bg)" }}
      >
        <Container className="flex flex-col gap-7.5">
          <AboutStory />
          <AboutFaq />
        </Container>
      </section>
    </>
  );
}
