"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

const SPANS = ["md:col-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-2"];

export default function ServicesPage() {
  const { t } = useLang();
  const items = t("services.items");
  const stats = t("servicesPage.stats");

  return (
    <>
      {/* Service cards */}
      <section className="bg-bg py-24 lg:py-32">
        <Container>
             <SectionHeader  tag={t("servicesPage.hero.tag")}
            title={t("servicesPage.hero.title")} />
          <div className="grid pt-10 auto-rows-fr gap-5 md:grid-cols-3">
            {(Array.isArray(items) ? items : []).map((item, i) => {
              const wide = SPANS[i % SPANS.length] === "md:col-span-2";
              return (
                <article
                  key={item.title}
                  className={`group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all border-primary/40 hover:shadow-card ${SPANS[i % SPANS.length]}`}
                >
                  <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 scale-150" />
                  <div className="relative flex items-start justify-between">
                    <span className="font-mono text-sm font-semibold text-primary/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                      <Icon name={item.icon} size={24} />
                    </span>
                  </div>
                  <div className={`relative ${wide ? "mt-10 max-w-md" : "mt-8"}`}>
                    <h4>{item.title}</h4>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="bg-surface py-20">
        <Container>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {(Array.isArray(stats) ? stats : []).map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-primary">{stat.value}</p>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-bg py-24">
        <Container>
          <div className="rounded-3xl border border-primary/20 bg-primary/8 p-12 text-center">
            <h2>{t("servicesPage.cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t("servicesPage.cta.subtitle")}</p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30"
            >
              {t("servicesPage.cta.button")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
