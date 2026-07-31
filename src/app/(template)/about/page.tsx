import { AboutStory } from "@/components/about/AboutStory";
import { AboutFaq } from "@/components/about/AboutFaq";

export const metadata = {
  title: "About — AdCrypto",
  description: "Learn what AdCrypto is building and why.",
};

export default function AboutPage() {
  return (
    // The design's own page frame: 56px of padding around a centred 1180px
    // column, 90px under it, and a 30px gap between the panel and the FAQ. Below
    // `xl` the column simply takes the width it has.
    <section
      className="px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 xl:px-14 xl:pb-22.5"
      style={{ background: "var(--suite-bg)" }}
    >
      <div className="mx-auto flex w-full max-w-295 flex-col gap-7.5">
        <AboutStory />
        <AboutFaq />
      </div>
    </section>
  );
}
