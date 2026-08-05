"use client";

import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

function CoinChart() {
  return (
    <div className="relative w-full text-primary">
      <svg viewBox="0 0 320 300" className="w-full" fill="none" aria-hidden>
        <path d="M30 240 L90 195 L140 210 L210 115 L270 65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="30" cy="240" r="8" fill="currentColor" />
        <circle cx="270" cy="65" r="11" fill="currentColor" />
        {[
          [70, 150, 100],
          [110, 120, 140],
          [150, 165, 80],
        ].map(([x, top, h], i) => (
          <line key={i} x1={x} y1={top} x2={x} y2={top + h} stroke="currentColor" strokeWidth="14" strokeLinecap="round" opacity={0.5} />
        ))}
        <circle cx="218" cy="205" r="66" fill="currentColor" />
        <circle cx="218" cy="205" r="66" fill="white" opacity="0.12" />
        <text x="218" y="205" textAnchor="middle" dominantBaseline="central" fontSize="74" fontWeight="700" fill="white">$</text>
      </svg>
    </div>
  );
}

export function About() {
  const { t } = useLang();
  const points = t("about.points");

  return (
    <section id="about" className="bg-bg py-24 lg:py-32">
      <Container className="grid items-center gap-16 lg:grid-cols-2">
        {/* Copy + checklist */}
        <div>
          <SectionHeader tag={t("about.tag")} title={t("about.title")} />
          <p className="mt-6 leading-relaxed text-muted">{t("about.desc")}</p>

          <ul className="mt-9 space-y-4">
            {(Array.isArray(points) ? points : []).map((point, i) => (
              <li key={point} className="flex items-center gap-4 border-b border-border pb-4 last:border-0">
                <span className="font-mono text-sm font-semibold text-primary/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon name="check" size={15} strokeWidth={2.6} />
                </span>
                <span className="font-medium text-body">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Framed illustration with corner bracket + floating badge */}
        <div className="relative">
          <div aria-hidden className="absolute -left-4 -top-4 h-24 w-24 rounded-tl-3xl border-l-2 border-t-2 border-primary/40" />
          <div aria-hidden className="absolute -bottom-4 -right-4 h-24 w-24 rounded-br-3xl border-b-2 border-r-2 border-primary/40" />

          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10">
            <div aria-hidden className="absolute inset-10 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative animate-[floaty_8s_ease-in-out_infinite]">
              <CoinChart />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
