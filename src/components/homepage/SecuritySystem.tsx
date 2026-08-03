"use client";

import {
  Activity,
  BrickWall,
  KeyRound,
  LockKeyhole,
  MailCheck,
  ScanFace,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { cn } from "@/components/ui/cn";

/**
 * Widths are deliberately uneven, on a 12-column grid:
 *
 *   row 1   5 | 4 | 3      row 2   3 | 4 | 5      row 3   6 | 6
 *
 * Every row still totals 12, so nothing is left ragged, but the mirrored 5-4-3 /
 * 3-4-5 rhythm gives the section hierarchy that eight equal tiles cannot. The two
 * half-width cards close it out.
 *
 * `wide` cards put the icon beside the text instead of above it — at ~600px a
 * single column of copy runs past a comfortable measure.
 *
 * The uneven grid only turns on at `xl`. On a 12-column grid a 1024px container
 * gives about 63px per column, so a 3-span card came out ~230px wide — roughly 25
 * characters per line at the `lg` body size, which is below a readable measure.
 * Between `sm` and `xl` the section falls back to two equal columns instead.
 */
const LAYERS: { key: string; icon: LucideIcon; span: string; wide?: boolean }[] = [
  // Ordered so the longest copy takes the widest slot in each row. A 3-column
  // card is only ~44 characters per line, so putting a long description there
  // makes it run several lines taller than its neighbours.
  { key: "twoFa", icon: KeyRound, span: "xl:col-span-5" },
  { key: "smsEmail", icon: MailCheck, span: "xl:col-span-4" },
  { key: "kyc", icon: ScanFace, span: "xl:col-span-3" },
  { key: "rbac", icon: UserCog, span: "xl:col-span-3" },
  { key: "behavior", icon: Activity, span: "xl:col-span-4" },
  { key: "waf", icon: BrickWall, span: "xl:col-span-5" },
  { key: "encryption", icon: LockKeyhole, span: "xl:col-span-6", wide: true },
  { key: "ssl", icon: ShieldCheck, span: "xl:col-span-6", wide: true },
];

/** Four bars that fill left-to-right on hover — the "layers" idea, in miniature. */
function LayerBars() {
  return (
    <span aria-hidden className="flex items-end gap-1">
      {[8, 11, 14, 17].map((h, i) => (
        <span
          key={h}
          className="w-1 rounded-full bg-primary/25 transition-colors duration-500 group-hover:bg-primary"
          style={{ height: `${h}px`, transitionDelay: `${i * 70}ms` }}
        />
      ))}
    </span>
  );
}

function LayerCard({ item, index }: { item: (typeof LAYERS)[number]; index: number }) {
  const { t } = useLang();
  const Icon = item.icon;
  const base = `security.items.${item.key}`;

  return (
    // A 1px gradient BORDER: the outer element IS the gradient and the inner panel
    // covers all but its edge. A plain `border-*` cannot fade along its length.
    <article
      className={cn(
        "group relative rounded-3xl bg-linear-to-b from-primary/30 via-border to-border p-px transition-all duration-500 hover:-translate-y-1.5 hover:from-primary hover:via-primary/40",
        item.span,
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[23px] bg-linear-to-b from-card to-surface p-6 sm:p-7">
        {/* Hairline that sweeps across the top edge on hover. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        {/* Spotlight bleeding in from above. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/25 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        />
        {/* Hatched corner — a texture, not content, so it is masked to fade out. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rotate-12 opacity-50 transition-all duration-700 group-hover:rotate-3 group-hover:opacity-90"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgb(var(--primary__color) / 0.4) 0 1px, transparent 1px 7px)",
            maskImage: "radial-gradient(closest-side, #000, transparent)",
            WebkitMaskImage: "radial-gradient(closest-side, #000, transparent)",
          }}
        />

        {/* No `flex-1` here on purpose: pushing the footer to the card's bottom
            opens a visible gap under the shorter descriptions, because the grid
            stretches every card in a row to the tallest one. Letting the footer
            follow the text turns that leftover space into bottom padding. */}
        {/* `wide` only means "icon beside the text" once the card really is wide.
            Below `xl` these two share the same two-column grid as every other card,
            where a side-by-side icon leaves ~160px for the copy. */}
        <div className={cn("relative flex gap-5", item.wide ? "flex-col xl:flex-row" : "flex-col")}>
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:ring-primary group-hover:shadow-lg group-hover:shadow-primary/30",
              item.wide ? "h-12 w-12 xl:h-14 xl:w-14" : "h-12 w-12",
            )}
          >
            <Icon size={item.wide ? 24 : 21} aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h5>{t(`${base}.title`)}</h5>
              <span
                aria-hidden
                className="shrink-0 text-[11px] font-semibold tabular-nums text-muted/60 transition-colors duration-500 group-hover:text-primary"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="mt-2">{t(`${base}.text`)}</p>
          </div>
        </div>

        <div className="relative mt-6 flex items-center justify-between gap-4">
          <span
            aria-hidden
            className="h-0.5 w-8 rounded-full bg-linear-to-r from-primary to-primary/20 transition-all duration-500 group-hover:w-16 rtl:bg-linear-to-l"
          />
          <LayerBars />
        </div>
      </div>
    </article>
  );
}

export function SecuritySystem() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      {/* Concentric rings + a soft bloom behind the header — the "layers" concept
          stated once, visually, so the cards don't each have to carry it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 hidden h-170 w-170 -translate-x-1/2 lg:block"
      >
        <span
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgb(var(--primary__color) / 0.14), transparent 70%)",
          }}
        />
        {[0, 1, 2, 3, 4].map((ring) => (
          <span
            key={ring}
            className="absolute inset-0 rounded-full border border-primary/12"
            style={{ transform: `scale(${1 - ring * 0.18})` }}
          />
        ))}
      </div>

      <Container className="relative">


        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 xl:grid-cols-12">
          {LAYERS.map((item, i) => (
            <LayerCard key={item.key} item={item} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
