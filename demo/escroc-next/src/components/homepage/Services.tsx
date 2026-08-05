"use client";

import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

// Bento spans: wide / narrow / narrow / wide → an asymmetric 2-1 · 1-2 layout.
const SPANS = ["md:col-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-2"];

export function Services() {
  const { t } = useLang();
  const items = t("services.items");

  return (
    <section id="services" className="bg-surface py-24 lg:py-32">
      <Container>
        <SectionHeader tag={t("services.tag")} title={t("services.title")} />

        <div className="mt-14 grid auto-rows-fr gap-5 md:grid-cols-3">
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
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl  transition-colors bg-primary text-white">
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
  );
}
