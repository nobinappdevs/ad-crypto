"use client";

import { useLang } from "@/hooks/useLang";
import { GiftScene } from "./GiftScene";

/**
 * The tinted half of the About and Auth panels: gift scene, one headline with an
 * accented phrase, and a three-cell stat strip. Both pages use the same block —
 * only the copy and the panel's minimum height differ, so they cannot drift.
 *
 * `floorClass` carries the panel's minimum height, as a literal utility from the
 * calling page (`lg:min-h-155`) rather than a number: the floor only exists
 * to balance the content column beside it, and below `lg` the two are stacked,
 * where it would just leave a gap under the stats. It has to arrive as a literal
 * so Tailwind's scanner can see the class it needs to generate.
 */
export function PromoPanel({
  baseKey,
  stats,
  floorClass,
}: {
  /** i18n prefix — `aboutPanel` or `authPanel`. */
  baseKey: string;
  stats: readonly string[];
  floorClass: string;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`${baseKey}.${name}`);

  return (
    <div
      className={`relative m-3 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[22px] px-5 pt-8 pb-7 sm:m-4.5 sm:px-10 sm:pt-11.5 sm:pb-10 ${floorClass}`}
      style={{ background: "var(--panel-promo-bg)" }}
    >
      <GiftScene />

      {/* `nowrap` only from `xl`, where the panel is wide enough for the line the
          design sets — below that it wraps instead of overflowing. */}
      <h2
        className="mt-3.5 w-full text-center text-[19px]! leading-[1.3]! font-bold! tracking-[-0.025em] text-panel-fg sm:text-[21px]! lg:text-[23px]! xl:whitespace-nowrap"
      >
        {k("promoLead")} <span className="inline! text-primary!">{k("promoAccent")}</span>{" "}
        {k("promoTail")}
      </h2>

      <div
        className="mt-5.5 grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-panel-line"
        style={{ background: "var(--panel-stat)" }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat}
            className={
              "flex flex-col items-center gap-1.25 px-2.5 py-4.5 text-center sm:px-3.5 " +
              // Only the middle cell is ruled, exactly as in the design.
              (i === 1 ? "border-x border-panel-line" : "")
            }
          >
            <span className="text-[15px]! font-bold! text-panel-fg sm:text-[16px]!">
              {k(`stats.${stat}.value`)}
            </span>
            <span className="text-[11px]! leading-[1.35]! text-panel-muted sm:text-[11.5px]!">
              {k(`stats.${stat}.label`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
