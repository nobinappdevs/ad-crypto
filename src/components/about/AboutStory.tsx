"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { PromoPanel } from "@/components/promo/PromoPanel";
import { SectionKicker } from "@/components/ui/SectionKicker";

/**
 * The About panel: the shared promo half on the left, the story on the right.
 *
 * The design is a fixed 1180px composition at a 1fr / 1.08fr split. That split is
 * kept from `lg` up and the two halves stack below it — the only responsive
 * addition; every colour, radius, size and gap is the source design's.
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
    <div
      className="grid grid-cols-1 overflow-hidden rounded-[30px] border border-panel-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]"
      style={{ background: "var(--panel-bg)", boxShadow: "var(--panel-shadow)" }}
    >
      <PromoPanel baseKey="aboutPanel" stats={STATS} floorClass="lg:min-h-155" />

      <div className="flex flex-col justify-center gap-5.5 px-5 py-10 sm:px-10 sm:py-14 lg:px-15.5 lg:py-14.5">
        <SectionKicker textClassName="text-panel-muted">{k("badge")}</SectionKicker>

        <h1 className="text-[30px]! leading-[1.1]! font-bold! tracking-[-0.035em] text-panel-fg sm:text-[36px]! lg:text-[44px]!">
          {k("headingLine1")}
          <br />
          {k("headingLine2")}
        </h1>

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
            className="rounded-full bg-primary px-6.5 py-3.5 text-[14.5px]! font-bold! text-white! transition-transform duration-[250ms] hover:-translate-y-0.5"
            style={{ boxShadow: "0 16px 32px rgb(1 148 252 / 0.32)" }}
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
