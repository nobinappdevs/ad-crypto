"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { PromoPanel } from "@/components/promo/PromoPanel";

/**
 * The About story: the shared promo half on the left, the copy on the right.
 *
 * A 1fr / 1.08fr split from `lg` up, stacking below it. The two halves sit
 * DIRECTLY in the page container rather than inside a bordered, shadowed card the
 * way the source mock drew them: the card was narrower than the container it sat
 * in, so the section read as a floating box on the page instead of part of it —
 * and the FAQ below has always been laid out this way, in the same container, with
 * no card of its own.
 *
 * The mock also carried its own logo + theme-toggle strip above the panel. That is
 * dropped here: this page renders inside the template layout, which already has
 * both in the navbar.
 */
const BULLETS = ["custody", "settlement", "fees"] as const;
const STATS = ["founded", "transactions", "gateways"] as const;

function CheckMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}

export function AboutStory() {
  const { t } = useLang();
  const k = (name: string) => t(`aboutPanel.${name}`);

  return (
    <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14">
      {/* No inset: with the card gone there is nothing for the promo block to float
          inside, so it fills its own column instead. */}
      <PromoPanel baseKey="aboutPanel" stats={STATS} floorClass="lg:min-h-155" insetClass="" />

      {/* The copy's horizontal padding went with the card — it was the card's inner
          padding, and keeping it would hold the text 62px short of the container's
          edge on the one side that has no neighbour. */}
      <div className="flex flex-col justify-center gap-5.5">
        <h2 className="text-[30px]! leading-[1.1]! font-bold! tracking-[-0.035em] text-panel-fg sm:text-[36px]! lg:text-[44px]!">
          {k("headingLine1")}
          <br />
          {k("headingLine2")}
        </h2>

        <p className="text-[15px]! leading-[1.78]! text-panel-muted">{k("para1")}</p>
        <p className="text-[15px]! leading-[1.78]! text-panel-muted">{k("para2")}</p>

        <div className="flex flex-col gap-3.5 pt-1.5">
          {BULLETS.map((bullet) => (
            <div key={bullet} className="flex items-start gap-3.25">
              <span
                aria-hidden
                className="grid! h-6.5 w-6.5 shrink-0 place-items-center rounded-[9px] bg-primary"
                style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.4)" }}
              >
                <CheckMark />
              </span>
              <span className="text-[14.5px]! leading-[1.6]! text-panel-fg">
                {k(`bullets.${bullet}`)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="#faq"
            className="btn-lift rounded-full bg-primary px-6.5 py-3.5 text-[14.5px]! font-bold! text-white!"
          >
            {k("ctaFaq")}
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-panel-line px-6.5 py-3.5 text-[14.5px]! font-semibold! text-panel-fg! transition-colors duration-[250ms] hover:border-primary"
            style={{ background: "var(--panel-field)" }}
          >
            {k("ctaContact")}
          </Link>
        </div>
      </div>
    </div>
  );
}
