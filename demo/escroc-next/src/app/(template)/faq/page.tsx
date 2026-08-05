"use client";

import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

export default function FaqPage() {
  const { t } = useLang();
  const items = t("faqPage.items");
  const list: { q: string; a: string }[] = Array.isArray(items) ? items : [];
  const [open, setOpen] = useState<number | null>(0);

  // Two independent columns (like the reference layout) — left gets the ceil
  // half so an odd item count still balances visually.
  const mid = Math.ceil(list.length / 2);
  const columns = [list.slice(0, mid), list.slice(mid)];

  return (
    <section className="bg-bg py-24 lg:py-32">
      <Container className="max-w-5xl">
        <SectionHeader tag={t("faqPage.tag")} title={t("faqPage.title")} align="center" />
        <p className="mx-auto mt-5 max-w-xl text-center leading-relaxed text-muted">
          {t("faqPage.subtitle")}
        </p>

        <div className="mt-14 grid gap-x-10 gap-y-6 lg:grid-cols-2">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col divide-y divide-border">
              {col.map((item, i) => {
                const idx = colIdx * mid + i;
                const isOpen = open === idx;
                return (
                  <div key={item.q} className="py-5 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : idx)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                    >
                      <span className="font-semibold text-heading">{item.q}</span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <Icon name="arrow" size={14} strokeWidth={2.6} className="rotate-90" />
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
