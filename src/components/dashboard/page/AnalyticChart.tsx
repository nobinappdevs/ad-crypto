"use client";

import { useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";

/**
 * The Analytic panel's chart: a revenue area over a target line, with a snapping
 * tooltip. Geometry lives in a 0-100 viewBox stretched with
 * `preserveAspectRatio="none"`, so strokes carry `non-scaling-stroke` and every
 * label is HTML on top, where stretching cannot distort it.
 */
const DATES = [
  "Jan 21, 2023",
  "Mar 21, 2023",
  "May 21, 2023",
  "Jul 21, 2023",
  "Sep 21, 2023",
  "Nov 21, 2023",
  "Jan 21, 2024",
  "Mar 21, 2024",
  "May 21, 2024",
  "Jul 21, 2024",
  "Sep 21, 2024",
  "Nov 21, 2024",
];

/** $M against the axis; the tooltip's dollar figures are derived from these. */
const REVENUE = [2.4, 3.3, 2.7, 4.2, 3.1, 3.283999, 4.5, 3.8, 5.4, 4.9, 6.6, 7.8];
const TARGET = [3.2, 2.8, 3.5, 3.0, 3.6, 1.81, 2.9, 3.4, 3.0, 3.7, 3.3, 4.1];

/** The design's pinned tooltip point — Nov 21, 2023. */
const DEFAULT_INDEX = 5;

const Y_MAX = 10;
const Y_LABELS = ["$10M", "$8M", "$6M", "$4M", "$2M", "$0"];
const X_LABELS = ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Q4"];

const xOf = (i: number) => (i / (REVENUE.length - 1)) * 100;
const yOf = (v: number) => 100 - (v / Y_MAX) * 100;

const money = (m: number) =>
  "$" + (m * 10000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Catmull-Rom through every point, emitted as cubic beziers. */
function smoothPath(values: number[]) {
  const pts = values.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

const REVENUE_PATH = smoothPath(REVENUE);
const TARGET_PATH = smoothPath(TARGET);
const AREA_PATH = `${REVENUE_PATH} L 100 100 L 0 100 Z`;

export function AnalyticChart() {
  const { t } = useLang();
  const plotRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(DEFAULT_INDEX);

  const onMove = (e: React.PointerEvent) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setIndex(Math.round(ratio * (REVENUE.length - 1)));
  };

  const x = xOf(index);
  const y = yOf(REVENUE[index]);

  return (
    <div className="px-4 pt-4 pb-8 sm:px-5">
      <div className="flex">
        {/* Y axis */}
        <div className="flex w-11 shrink-0 flex-col justify-between pb-0.5 text-right">
          {Y_LABELS.map((tick) => (
            <span key={tick} className="pr-2.5 text-[11px]! text-muted">
              {tick}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div
          ref={plotRef}
          onPointerMove={onMove}
          onPointerLeave={() => setIndex(DEFAULT_INDEX)}
          className="relative h-56 min-w-0 flex-1 cursor-crosshair touch-none sm:h-64"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id="analytic-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "rgb(var(--primary__color))" }} stopOpacity="0.22" />
                <stop offset="1" style={{ stopColor: "rgb(var(--primary__color))" }} stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d={AREA_PATH} fill="url(#analytic-fill)" />
            <path
              d={TARGET_PATH}
              fill="none"
              stroke="#f2b21b"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={REVENUE_PATH}
              fill="none"
              style={{ stroke: "rgb(var(--primary__color))" }}
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Marker: dashed drop line + halo dot at the active point. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 border-l border-dashed border-heading/25"
            style={{ left: `${x}%` }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-[0_0_0_4px_rgb(var(--primary__color)/0.2)]"
            style={{ left: `${x}%`, top: `${y}%` }}
          />

          {/* Tooltip — clamped so it never leaves the plot at either edge. */}
          <div
            className="pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-xl bg-[#10131c] px-3.5 py-2.5 text-white shadow-xl"
            style={{
              left: `clamp(72px, ${x}%, calc(100% - 72px))`,
              top: `${y}%`,
              transform: "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <div className="text-[11px]! font-semibold text-white/65">{DATES[index]}</div>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-1 rounded-full bg-primary" />
                <div>
                  <div className="text-[9.5px]! text-white/55">{t("dashboard.revenue")}</div>
                  <div className="text-[12px]! font-bold">{money(REVENUE[index])}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-1 rounded-full bg-[#f2b21b]" />
                <div>
                  <div className="text-[9.5px]! text-white/55">{t("dashboard.target")}</div>
                  <div className="text-[12px]! font-bold">{money(TARGET[index])}</div>
                </div>
              </div>
            </div>
          </div>

          {/* X axis */}
          <div aria-hidden className="absolute inset-x-0 top-full flex justify-between pt-2.5">
            {X_LABELS.map((tick, i) => (
              <span key={`${tick}-${i}`} className="text-[11px]! text-muted">
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
