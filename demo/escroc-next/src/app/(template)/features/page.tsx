"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

export default function FeaturesPage() {
  const { t } = useLang();
  const items = t("featuresPage.items");
  const list = Array.isArray(items) ? items : [];

  return (
    <>
      {/* Feature grid */}
      <section className="bg-bg py-24 lg:py-32">
        <Container>
          <SectionHeader   tag={t("featuresPage.hero.tag")}
            title={t("featuresPage.hero.title")} />
          <div className="grid gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item, i) => (
              <article
                key={item.title}
                className="group rounded-3xl border border-border bg-card p-8 transition-all hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm font-semibold text-primary/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon name={item.icon} size={22} />
                  </span>
                </div>
                <h4 className="mt-6">{item.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.desc}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-surface py-24">
        <Container>
          <div className="rounded-3xl border border-primary/20 bg-primary/8 p-12 text-center">
            <h2>{t("featuresPage.cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t("featuresPage.cta.subtitle")}</p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30"
            >
              {t("featuresPage.cta.button")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
