"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { useFitScale } from "@/hooks/useFitScale";
import { useReveal } from "@/hooks/useReveal";
import { SectionKicker } from "@/components/ui/SectionKicker";

/**
 * The illustration is a fixed canvas: three arcs on a 560x400 viewBox, nodes on
 * their endpoints, chips pinned between them. That alignment IS the picture, so it
 * renders at real size and scales to fit (see useFitScale) rather than reflowing.
 *
 * 600 wide, not 560, because the dot field starts at x=40. It bleeds past the box
 * by design — the section clips it.
 */
const CANVAS_W = 600;
const CANVAS_H = 420;

/** Chip surface — shared by all three so they can't drift apart. */
const CHIP_STYLE: CSSProperties = {
  background: "var(--suite-chip-card)",
  borderColor: "var(--suite-card-br)",
  color: "var(--suite-card-fg)",
  boxShadow: "0 16px 34px rgb(1 20 40 / 0.28)",
};

const CHIP_CLASS =
  "absolute inline-flex! items-center rounded-full border text-[14px]! font-semibold";

/** Each arc's endpoints are where the nodes sit, so the two lists move together. */
const ARCS = [
  { d: "M40 190 C 150 60, 300 40, 360 96", opacity: 0.75, duration: "3.2s", delay: "0s" },
  { d: "M300 130 C 340 40, 470 44, 520 128", opacity: 0.6, duration: "3.8s", delay: "0.4s" },
  { d: "M262 170 C 300 116, 360 130, 384 174", opacity: 0.5, duration: "3s", delay: "0.8s" },
];

const NODES = [
  { cx: 40, cy: 190, delay: "0s" },
  { cx: 262, cy: 170, delay: "0.6s" },
  { cx: 384, cy: 174, delay: "1.2s" },
  { cx: 520, cy: 128, delay: "1.8s" },
];

const STATS = ["gateways", "currencies", "transactions"] as const;

function Chip({
  className,
  style,
  duration,
  delay,
  children,
}: {
  className: string;
  style: CSSProperties;
  duration: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${CHIP_CLASS} ${className}`}
      style={{
        ...CHIP_STYLE,
        ...style,
        animation: `suite-float-chip ${duration} ease-in-out ${delay} infinite`,
      }}
    >
      {children}
    </div>
  );
}

function OverviewGraphic() {
  const { t } = useLang();
  const { attach, scale } = useFitScale(CANVAS_W);

  return (
    <div ref={attach} className="relative w-full" style={{ height: CANVAS_H * scale }}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}
      >
        {/* Dot field, masked to a soft disc so it has no hard edge. */}
        <div
          aria-hidden
          className="absolute -bottom-10 left-10 h-140 w-140 opacity-85"
          style={{
            backgroundImage: "radial-gradient(var(--suite-dot) 1.6px, transparent 1.6px)",
            backgroundSize: "13px 13px",
            maskImage:
              "radial-gradient(circle at 50% 50%, #000 58%, rgb(0 0 0 / 0.35) 72%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 50%, #000 58%, rgb(0 0 0 / 0.35) 72%, transparent 78%)",
          }}
        />

        {/* `overflow-visible` matters: the stroke caps and the scaled nodes sit
            slightly outside the viewBox. */}
        <svg
          viewBox="0 0 560 400"
          className="absolute top-2.5 left-5 h-100 w-140 overflow-visible"
          aria-hidden
        >
          {ARCS.map((arc) => (
            <path
              key={arc.d}
              d={arc.d}
              fill="none"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="420"
              style={{
                stroke: "rgb(var(--primary__color))",
                strokeOpacity: arc.opacity,
                animation: `suite-draw-arc ${arc.duration} ease-in-out ${arc.delay} infinite alternate`,
              }}
            />
          ))}
          {NODES.map((node) => (
            <circle
              key={`${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r="4"
              style={{
                fill: "rgb(var(--primary__color))",
                transformOrigin: `${node.cx}px ${node.cy}px`,
                animation: `suite-pulse-dot 2.4s ease-in-out ${node.delay} infinite`,
              }}
            />
          ))}
        </svg>

        <Chip
          className="gap-2 px-[18px] py-[11px]"
          style={{ left: 300, top: 4 }}
          duration="5.5s"
          delay="0s"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: "rgb(var(--primary__color))" }}
            aria-hidden
          >
            <path d="M4.5 12.5l5 5 10-11" />
          </svg>
          {t("overview.chips.verified")}
        </Chip>

        <Chip
          className="gap-2.5 px-5 py-[11px]"
          style={{ left: 138, top: 128 }}
          duration="6.4s"
          delay="0.8s"
        >
          <span className="inline! font-bold! text-primary!">$</span>{" "}
          {t("overview.chips.amount")}
        </Chip>

        <Chip
          className="gap-[9px] px-5 py-[11px]"
          style={{ left: 384, top: 158 }}
          duration="5.9s"
          delay="1.6s"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: "rgb(var(--primary__color))" }}
            aria-hidden
          >
            <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
            <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
          </svg>
          {t("overview.chips.range")}
        </Chip>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

export function Overview() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  useReveal(sectionRef);

  const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

  return (
    // No top padding: the dome below is anchored to the section's top edge, and
    // the content is pushed down past its curve by the inner `pt` instead. Adding
    // padding here would slide the whole arc down with it.
    <section
      ref={sectionRef}
      data-suite-overview
      className="relative overflow-hidden pb-20 sm:pb-24 lg:px-14 lg:pb-[110px]"
      // Flat: see --suite-bg-flat. SecuritySuite above still carries the
      // gradient, and its lower reaches have already faded to this exact colour,
      // so the run reads as one continuous field from here down to the footer.
      style={{ background: "var(--suite-bg-flat)" }}
    >
      {/* The dome — wider than the section so only the crown shows, on an elliptical
          radius so it reads as a horizon rather than a bubble.

          The mask is load-bearing: `overflow-hidden` used to shear the fill at the
          section's bottom edge, tinting the section and leaving a hard step. Fading
          the fill out early means the tint is gone before either boundary. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[12%] -left-[12%] top-0 h-[1180px] border-t"
        style={{
          borderRadius: "50% 50% 0 0 / 22% 22% 0 0",
          background: "var(--suite-arc-bg)",
          borderColor: "var(--suite-wm-line)",
          maskImage:
            "linear-gradient(180deg, #000 0%, rgb(0 0 0 / 0.55) 38%, transparent 68%)",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, rgb(0 0 0 / 0.55) 38%, transparent 68%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 pt-24 sm:px-6 sm:pt-32 lg:px-0 lg:pt-[210px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* ---------------- Copy ---------------- */}
          <div data-reveal className="flex flex-col gap-[18px]" style={delay(0)}>
            <SectionKicker color="var(--suite-muted)">{t("overview.badge")}</SectionKicker>

            <h2
              className="text-[30px]! leading-[1.12]! font-bold! tracking-[-0.035em] wrap-break-word sm:text-[40px]! lg:text-[44px]! xl:text-[52px]!"
              style={{ color: "var(--suite-fg)" }}
            >
              {t("overview.headingLead")}
              <br />
              <span className="text-primary!">{t("overview.headingAccent")}</span>
            </h2>

            <p
              className="max-w-[470px] text-[15px]! leading-[1.75]!"
              style={{ color: "var(--suite-card-muted)" }}
            >
              {t("overview.text")}
            </p>
          </div>

          {/* ---------------- Illustration ----------------
              Full-bleed below `sm`: the canvas scales to the width it is given, so
              the section's gutters were coming off the illustration itself. */}
          <div data-reveal className="-mx-4 sm:mx-0" style={delay(160)}>
            <OverviewGraphic />
          </div>
        </div>

        {/* ---------------- Stats ---------------- */}
        <div
          className="mt-14 grid grid-cols-1 gap-8 border-t pt-8 sm:grid-cols-3 sm:gap-10 lg:mt-[74px] lg:pt-[34px]"
          style={{ borderColor: "var(--suite-card-br)" }}
        >
          {STATS.map((key, i) => (
            <div
              key={key}
              data-reveal
              className="flex flex-col gap-2.5"
              style={delay(240 + i * 100)}
            >
              <span
                className="text-[36px]! leading-none! font-bold! tracking-[-0.03em] sm:text-[44px]!"
                style={{ color: "var(--suite-fg)" }}
              >
                {t(`overview.stats.${key}.value`)}
              </span>
              <span className="text-[15px]! font-semibold! text-primary!">
                {t(`overview.stats.${key}.label`)}
              </span>
              <p
                className="max-w-[280px] text-[13.5px]! leading-[1.6]!"
                style={{ color: "var(--suite-card-muted)" }}
              >
                {t(`overview.stats.${key}.text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
