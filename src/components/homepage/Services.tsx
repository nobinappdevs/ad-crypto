"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  Headphones,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { cn } from "@/components/ui/cn";
import { SectionKicker } from "@/components/ui/SectionKicker";

/**
 * The first entry is `featured` and takes a 2x2 cell with a highlight list, so
 * the grid opens on something substantial instead of eight identical tiles.
 *
 * That 2x2 plus six single cells leaves one empty slot at the end of a
 * four-column grid, so the last entry is `wide` and spans two columns to close
 * it. Change the number of services and these two flags need revisiting.
 */
const SERVICES: { key: string; icon: LucideIcon; featured?: boolean; wide?: boolean }[] = [
  { key: "exchange", icon: ArrowLeftRight, featured: true },
  { key: "payments", icon: CreditCard },
  { key: "security", icon: ShieldCheck },
  { key: "wallet", icon: Wallet },
  { key: "support", icon: Headphones },
  { key: "analytics", icon: BarChart3 },
  { key: "mobile", icon: Smartphone },
  { key: "p2p", icon: Users, wide: true },
];

const HIGHLIGHT_KEYS = ["spread", "pairs", "settlement"] as const;

function IconTile({ icon: Icon, large }: { icon: LucideIcon; large?: boolean }) {
  return (
    <span
      className={cn(
        // The gradient + coloured shadow is what lifts this off the card face; a
        // flat tinted square reads as the old design.
        "grid shrink-0 place-items-center rounded-2xl bg-linear-to-br from-primary to-hero-accent-soft text-white shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-105",
        large ? "h-15 w-15" : "h-12 w-12",
      )}
    >
      <Icon size={large ? 26 : 21} aria-hidden />
    </span>
  );
}

function ServiceCard({
  service,
  index,
}: {
  service: (typeof SERVICES)[number];
  index: number;
}) {
  const { t } = useLang();
  const base = `service.items.${service.key}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/45 sm:p-7",
        service.featured && "sm:col-span-2 lg:row-span-2 lg:justify-between",
        service.wide && "sm:col-span-2",
      )}
    >
      {/* Corner glow, off until hover. Sits behind the content and is clipped by
          the card's own rounding, so it reads as light inside the card. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(closest-side, rgb(var(--primary__color) / 0.5), transparent)" }}
      />

      <span
        aria-hidden
        className="absolute top-6 inset-e-6 text-[12px] font-semibold tabular-nums text-muted/70"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative">
        <IconTile icon={service.icon} large={service.featured} />

        {service.featured ? (
          <h3 className="mt-6">{t(`${base}.title`)}</h3>
        ) : (
          <h5 className="mt-5">{t(`${base}.title`)}</h5>
        )}

        <p className={cn("mt-3", service.featured && "max-w-md")}>{t(`${base}.text`)}</p>

        {service.featured && (
          <ul className="mt-6 flex flex-col gap-2.5">
            {HIGHLIGHT_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="inline! text-[13px] text-body md:text-[14px]">
                  {t(`service.highlights.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Accent rule that extends on hover — a quiet affordance rather than a
          button on every card. */}
      <div className="relative mt-6 flex items-center gap-3">
        <span
          aria-hidden
          className="h-0.5 w-8 rounded-full bg-linear-to-r from-primary to-hero-accent-soft transition-all duration-300 group-hover:w-14 rtl:bg-linear-to-l"
        />
        <span className="inline-flex! items-center gap-1.5 text-[13px] font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {t("service.learnMore")}
          <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
        </span>
      </div>
    </article>
  );
}

export function Services() {
  const { t } = useLang();

  return (
    <section className="pt-14 pb-20 sm:pt-16 sm:pb-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionKicker className="justify-center" textClassName="text-muted">
            {t("service.badge")}
          </SectionKicker>

          <h2 className="mt-4">
            {t("service.headingLead")} <span className="text-primary!">{t("service.headingAccent")}</span>
          </h2>

          <p className="mt-4">{t("service.subtitle")}</p>
        </div>

        {/* The featured card claims two columns and two rows, so the remaining
            six fill around it rather than leaving a hole. */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.key} service={service} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
