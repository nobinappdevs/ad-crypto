"use client";

import { Star, Check } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";

function Stars({ count = 5, size = 14 }) {
  const { t } = useLang();
  return (
    <div className="flex gap-0.5" aria-label={`${count} ${t("testimonials.starsLabel")}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < count ? "text-amber-400" : "text-border"}
          fill={i < count ? "currentColor" : "none"}
          aria-hidden
        />
      ))}
    </div>
  );
}

function Avatar({ name, colorClass }) {
  const initials = name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
  return (
    <span className={`flex shrink-0 items-center justify-center font-bold ${colorClass}`}>
      {initials}
    </span>
  );
}

const COLORS = [
  "bg-primary/15 text-primary",
  "bg-violet-500/15 text-violet-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-orange-500/15 text-orange-600",
];

const STATS = [
  { value: "4.9 / 5", label: "testimonials.statAvgRating" },
  { value: "2,000+", label: "testimonials.statHappy" },
  { value: "99%",    label: "testimonials.statSatisfaction" },
];

export function Testimonials() {
  const { t } = useLang();
  const items = t("testimonials.items") ?? [];
  const subtitle = t("testimonials.subtitle");
  const hasSubtitle = subtitle && subtitle !== "testimonials.subtitle";

  const [hero, ...rest] = items;

  return (
    <section className="relative overflow-hidden bg-bg">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 top-10  h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-48 bottom-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Container className="relative">

        {/* ── Section header ────────────────────────────── */}
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeader tag={t("testimonials.tag")} title={t("testimonials.title")} />
          {hasSubtitle && <p className="mt-4 text-muted">{subtitle}</p>}
        </div>

        {/* ── Trust stats row ───────────────────────────── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-y border-border py-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-heading">{value}</span>
              <span className="text-sm text-muted">{t(label)}</span>
            </div>
          ))}
        </div>

        {/* ── Bento grid ────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* ── Hero card (spans 2 rows on lg) ─────────── */}
          {hero && (
            <div className="relative flex flex-col overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-10 lg:row-span-2">

              {/* Watermark quote */}
              <span aria-hidden className="pointer-events-none absolute -right-4 -top-6 select-none font-serif text-[160px] leading-none text-primary/10">
                &ldquo;
              </span>

              {/* Stars + badge */}
              <div className="flex items-center justify-between gap-3">
                <Stars count={hero.rating ?? 5} size={16} />
                <span className="rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                  {t("testimonials.featured")}
                </span>
              </div>

              {/* Quote */}
              <blockquote className="relative mt-6 flex-1">
                <p className="text-[22px] font-medium leading-[1.65] text-heading">
                  &ldquo;{hero.quote}&rdquo;
                </p>
              </blockquote>

              {/* Divider */}
              <div className="my-7 h-px bg-primary/15" />

              {/* Author */}
              <div className="flex items-center gap-4">
                <Avatar name={hero.author} colorClass={`h-12 w-12 rounded-2xl text-sm ${COLORS[0]}`} />
                <div>
                  <p className="font-semibold text-heading">{hero.author}</p>
                  <p className="mt-0.5 text-sm text-muted">{hero.role}</p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <Check size={9} strokeWidth={3} aria-hidden />
                  {t("testimonials.verified")}
                </span>
              </div>
            </div>
          )}

          {/* ── Supporting cards ───────────────────────── */}
          {rest.map((item, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 transition-shadow duration-300 hover:shadow-card"
            >
              {/* Stars */}
              <Stars count={item.rating ?? 5} />

              {/* Opening quote mark */}
              <span aria-hidden className="-mb-2 -ml-0.5 mt-4 block select-none font-serif text-[52px] leading-none text-primary/15">
                &ldquo;
              </span>

              {/* Quote */}
              <blockquote className="flex-1">
                <p className="line-clamp-4 text-base font-medium leading-relaxed text-heading">
                  {item.quote}
                </p>
              </blockquote>

              {/* Divider */}
              <div className="my-5 h-px bg-border" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar name={item.author} colorClass={`h-10 w-10 rounded-xl text-sm ${COLORS[(i + 1) % COLORS.length]}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">{item.author}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
