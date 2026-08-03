"use client";

import { useLang } from "@/hooks/useLang";
import { Container } from "./Container";
import { BannerBackdrop } from "./BannerBackdrop";

/**
 * The compact banner every public page opens with: the page name and a short
 * accent rule, on the shared banner glow. Nothing else — the page's own sections
 * carry the descriptive copy, so a header that repeated it just pushed the real
 * content down.
 *
 * The heading takes its size from the `h1` base layer and only overrides colour,
 * so it stays in step with the rest of the site's type scale.
 */
export function PageHeader({ titleKey }: { titleKey: string }) {
  const { t } = useLang();

  return (
    // Top padding clears the fixed nav that overlays this section.
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-42 sm:pb-20 lg:pt-48 lg:pb-20">
      <BannerBackdrop />

      {/* `text-end` and `ms-auto` rather than `text-right`/`ml-auto`: the title
          sits at the end of the reading direction, so it lands on the right in
          English and mirrors to the left in Arabic. */}
      <Container className="relative z-10 text-end">
        <h1 className="tracking-tight text-hero-fg">{t(titleKey)}</h1>
        <span
          aria-hidden
          className="mt-5 ms-auto block h-0.75 w-16 rounded-full bg-linear-to-r from-hero-accent to-hero-accent-soft rtl:bg-linear-to-l"
        />
      </Container>
    </section>
  );
}
