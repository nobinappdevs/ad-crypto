"use client";

import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { SectionKicker } from "@/components/ui/SectionKicker";

/**
 * The FAQ block below the About panel: a sticky intro column and six accordion
 * rows, one open at a time (clicking the open row closes it, as in the design).
 *
 * The rows animate on `max-height`, which needs a concrete ceiling to tween
 * toward. The design's is 220px, which fits its own English copy on a 700px-wide
 * column — on a narrow screen, or in a language that runs longer, the same answer
 * needs more room, so the cap is raised below `lg` rather than clipping the text.
 */
const ITEMS = ["what", "protection", "currencies", "fees", "speed", "rewards"] as const;

export function AboutFaq() {
  const { t } = useLang();
  const k = (name: string) => t(`aboutPanel.faq.${name}`);

  const [open, setOpen] = useState(0);

  return (
    <div
      id="faq"
      className="grid grid-cols-1 items-start gap-8 pt-10 sm:gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:pt-11.5"
    >
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-10">
        <SectionKicker textClassName="text-panel-muted">{k("eyebrow")}</SectionKicker>
        <h2 className="text-[28px]! leading-[1.1]! font-bold! tracking-[-0.035em] text-panel-fg sm:text-[34px]! lg:text-[40px]!">
          {k("headingLine1")}
          <br />
          {k("headingLine2")}
        </h2>
        <p className="max-w-75 text-[14.5px]! leading-[1.7]! text-panel-muted">{k("text")}</p>
      </div>

      <div className="flex flex-col gap-3">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;

          return (
            <div
              key={item}
              className="overflow-hidden rounded-[18px] border transition-[border-color,background] duration-300"
              style={{
                borderColor: isOpen ? "rgb(var(--primary__color))" : "var(--panel-border)",
                background: isOpen ? "var(--panel-open)" : "var(--panel-field)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4.5 text-left text-[15px]! font-semibold! text-panel-fg sm:gap-5 sm:px-6 sm:py-5.5 sm:text-[16.5px]!"
              >
                {t(`aboutPanel.faq.items.${item}.q`)}
                <span
                  aria-hidden
                  className="grid! h-7.5 w-7.5 shrink-0 place-items-center rounded-full transition-[transform,background,color] duration-[350ms]"
                  style={{
                    background: isOpen ? "rgb(var(--primary__color))" : "var(--panel-field)",
                    color: isOpen ? "#ffffff" : "var(--panel-muted)",
                    transform: isOpen ? "rotate(135deg)" : "rotate(0deg)",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5.5v13M5.5 12h13" />
                  </svg>
                </span>
              </button>

              <div
                className={
                  "overflow-hidden transition-[max-height,opacity] duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] " +
                  (isOpen ? "max-h-120 opacity-100 lg:max-h-55" : "max-h-0 opacity-0")
                }
              >
                <p className="pr-5 pb-5 pl-5 text-[14.5px]! leading-[1.75]! text-panel-muted sm:pr-15.5 sm:pb-6 sm:pl-6">
                  {t(`aboutPanel.faq.items.${item}.a`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
