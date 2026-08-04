"use client";
import { useLang } from "@/hooks/useLang";
import { Container } from "./Container";
import { BannerBackdrop } from "./BannerBackdrop";

export function PageHeader({ titleKey }: { titleKey: string }) {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-42 sm:pb-20 lg:pt-48 lg:pb-20">
      <BannerBackdrop />
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
