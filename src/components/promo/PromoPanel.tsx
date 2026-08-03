"use client";

import { useLang } from "@/hooks/useLang";
import { GiftScene } from "./GiftScene";

export function PromoPanel({
  baseKey,
  stats,
  floorClass,
  statsBaseKey,
  statsVariant = "boxed",
  headingBaseKey,
  headingVariant = "promo",
  insetClass = "m-3 sm:m-4.5",
}: {
  /** i18n prefix — `aboutPanel` or `authPanel`. */
  baseKey: string;
  stats: readonly string[];
  floorClass: string;
  /** Defaults to `${baseKey}.stats`. */
  statsBaseKey?: string;
  statsVariant?: "boxed" | "descriptive";
  /** Defaults to `baseKey`. */
  headingBaseKey?: string;
  headingVariant?: "promo" | "descriptive";
  /**
   * The margin that insets this block from its parent. The default is the design's
   * inset inside a bordered card; a caller that has no card around it passes `""`
   * so the block sits flush in its column instead of floating inside nothing.
   */
  insetClass?: string;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`${baseKey}.${name}`);
  const kh = (name: string) => t(`${headingBaseKey ?? baseKey}.${name}`);
  const ks = (name: string) => t(`${statsBaseKey ?? `${baseKey}.stats`}.${name}`);

  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[22px] px-5 pt-8 pb-7 sm:px-10 sm:pt-11.5 sm:pb-10 ${insetClass} ${floorClass}`}
      style={{ background: "var(--panel-promo-bg)" }}
    >
      <GiftScene />

      {headingVariant === "descriptive" ? (
        <div className="mt-3.5 flex flex-col items-center gap-2.5 text-center">
          <h2 className="text-[19px]! leading-tight! font-bold! tracking-tight text-panel-fg sm:text-[22px]! lg:text-[25px]!">
            {kh("headingLead")}
            <br />
            <span className="inline! text-primary!">{kh("headingAccent")}</span>
          </h2>
          {/* <p className="max-w-90 text-[12.5px]! leading-[1.6]! text-panel-muted">{kh("text")}</p> */}
        </div>
      ) : (
        // `nowrap` only from `xl`, where the panel is wide enough for the line
        // the design sets — below that it wraps instead of overflowing.
        <h2 className="mt-3.5 w-full text-center text-[19px]! leading-[1.3]! font-bold! tracking-tight text-panel-fg sm:text-[21px]! lg:text-[23px]! xl:whitespace-nowrap">
          {k("promoLead")} <span className="inline! text-primary!">{k("promoAccent")}</span>{" "}
          {k("promoTail")}
        </h2>
      )}

      {statsVariant === "descriptive" ? (
        <div
          className="mt-6 grid w-full grid-cols-1 gap-5 border-t pt-5 text-center sm:grid-cols-3 sm:gap-4 sm:text-left"
          style={{ borderColor: "var(--panel-border)" }}
        >
          {stats.map((stat) => (
            <div key={stat} className="flex flex-col gap-1.5">
              <span className="text-[24px]! leading-none! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[26px]!">
                {ks(`${stat}.value`)}
              </span>
              <span className="text-[12.5px]! font-semibold! text-primary!">
                {ks(`${stat}.label`)}
              </span>
              <p className="text-[11.5px]! leading-[1.55]! text-panel-muted">
                {ks(`${stat}.text`)}
              </p>
            </div>
          ))}
        </div>
      ) : (
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
                {ks(`${stat}.value`)}
              </span>
              <span className="text-[11px]! leading-[1.35]! text-panel-muted sm:text-[11.5px]!">
                {ks(`${stat}.label`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
