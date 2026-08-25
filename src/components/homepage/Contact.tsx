"use client";

import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { ContactForm } from "@/components/forms/ContactForm";

/**
 * The three words step to the right. Indents are in `em` so the staircase keeps its
 * proportions, via padding-inline-start so it mirrors in Arabic.
 */
const TITLE_LINES = [
  { key: "contact.titleLine1", indent: "0em" },
  { key: "contact.titleLine2", indent: "0.45em" },
  { key: "contact.titleLine3", indent: "1.2em" },
];

export function Contact() {
  return (
    // No background of its own: the header's glow fades out into the page
    // background, so this section just continues that surface. Painting
    // `bg-hero-bg` here would reintroduce the band it used to leave behind.
    <section id="contact-form" className="pt-4 pb-20 sm:pb-24 lg:pb-28">
      <Container className="grid grid-cols-1 items-center gap-12 sm:gap-14 lg:grid-cols-2 lg:gap-20 xl:gap-24">
        <ContactHeading />
        <ContactForm />
      </Container>
    </section>
  );
}

function ContactHeading() {
  const { t } = useLang();

  return (
    <div>
      {/* Set against the LONGEST translation, not the English copy — from `lg` the
          column is half the container, and Spanish ran past its edge. */}
      <h2 className="text-[clamp(34px,12vw,46px)]! leading-[1.1]! font-bold tracking-[0.01em] wrap-break-word text-hero-fg uppercase sm:text-[62px]! md:text-[72px]! lg:text-[60px]! xl:text-[84px]!">
        {/* {TITLE_LINES.map((line) => (
          <span key={line.key} className="block!" style={{ paddingInlineStart: line.indent }}>
            {t(line.key)}
          </span>
        ))} */}
        {TITLE_LINES.map((line, index) => (
  <span
    key={line.key}
    style={{ paddingInlineStart: line.indent }}
    className={`block! ${index === 1 ? "text-primary" : "text-hero-fg"}`}
  >
    {t(line.key)}
  </span>
))}
      </h2>

      <p className="mt-8 max-w-105 text-[13px]! leading-[1.7]! text-hero-fg-muted sm:text-[14px]! lg:mt-9">
        {t("contact.subtitle")}
      </p>
    </div>
  );
}
