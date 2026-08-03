"use client";

import { useId, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { ChartViewToggle, tooltipPlacement, YAxis } from "./ChartViewToggle";

/**
 * A year of crypto bought, as a single-series line with point markers.
 *
 * Deliberately ONE measure on ONE axis. The source mock's tooltip carried both a
 * value and a count, which would mean two y-scales on one plot — the alignment
 * between them is arbitrary, so the chart would imply a relationship that isn't in
 * the data. The order count lives in the tooltip as context instead of being
 * plotted, so nothing is encoded against a second, invented scale.
 *
 * A single series needs no legend: the panel title names it.
 */
const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

/** Bought per month, in USD — the plotted measure. */
const VOLUME = [820, 1240, 1105, 1180, 690, 1265, 940, 1330, 1055, 1290, 760, 905];
/** Buy orders that month. Context for the tooltip, NOT a second plotted scale. */
const ORDERS = [14, 21, 19, 20, 12, 22, 16, 23, 18, 22, 13, 15];

/** Same ceiling as the transactions chart, so the two panels read at one scale. */
const Y_MAX = 1500;
const Y_TICKS = [1500, 1200, 900, 600, 300, 0];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const xOf = (i: number) => (i / (VOLUME.length - 1)) * 100;
const yOf = (v: number) => 100 - (v / Y_MAX) * 100;

const LINE_PATH = VOLUME.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(v)}`).join(" ");

export function BuyCryptoChart() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const plotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const tableId = useId();

  // Snap to the nearest point rather than requiring a hit on the 10px marker.
  const onMove = (e: React.PointerEvent) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setActive(Math.round(ratio * (VOLUME.length - 1)));
  };

  return (
    <div className="px-4 pt-1 pb-5 sm:px-5">
      <div className="mb-4 flex items-center justify-end">
        <ChartViewToggle on={asTable} onToggle={() => setAsTable((v) => !v)} controls={tableId} />
      </div>

      {asTable ? (
        <div id={tableId} className="max-h-64 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 text-start text-[12px]! font-semibold! text-muted">
                  {k("month")}
                </th>
                <th className="py-2 pl-3 text-end text-[12px]! font-semibold! text-muted">
                  {k("series.buyVolume")}
                </th>
                <th className="py-2 pl-3 text-end text-[12px]! font-semibold! text-muted">
                  {k("series.buyOrders")}
                </th>
              </tr>
            </thead>
            <tbody>
              {MONTH_KEYS.map((month, i) => (
                <tr key={month} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 text-[12.5px]!">{k(`months.${month}`)}</td>
                  <td className="py-2 pl-3 text-end text-[12.5px]! font-medium! tabular-nums">
                    {usd(VOLUME[i])}
                  </td>
                  <td className="py-2 pl-3 text-end text-[12.5px]! font-medium! tabular-nums">
                    {ORDERS[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex">
          <YAxis ticks={Y_TICKS} />

          <div className="relative min-w-0 flex-1">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
            >
              {Y_TICKS.map((tick) => (
                <span
                  key={tick}
                  className="h-px w-full"
                  style={{ background: "var(--chart-grid)" }}
                />
              ))}
            </div>

            <div
              ref={plotRef}
              onPointerMove={onMove}
              onPointerLeave={() => setActive(null)}
              className="relative h-56 cursor-crosshair touch-none sm:h-60"
            >
              {/* Crosshair band on the active month. */}
              {active !== null && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-6 -translate-x-1/2 rounded-md"
                  style={{ left: `${xOf(active)}%`, background: "var(--chart-grid)" }}
                />
              )}

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden
              >
                <path
                  d={LINE_PATH}
                  fill="none"
                  stroke="var(--chart-3)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Markers are HTML, not SVG circles: the viewBox is stretched with
                  `preserveAspectRatio="none"`, which would squash a circle into
                  an ellipse. The 2px surface ring separates a marker from the
                  line passing under it. */}
              {VOLUME.map((value, i) => (
                <span
                  key={MONTH_KEYS[i]}
                  aria-hidden
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card transition-transform duration-150"
                  style={{
                    left: `${xOf(i)}%`,
                    top: `${yOf(value)}%`,
                    background: "var(--chart-3)",
                    transform: `translate(-50%, -50%) scale(${active === i ? 1.4 : 1})`,
                  }}
                />
              ))}

              {active !== null && (
                <div
                  role="status"
                  className="pointer-events-none absolute z-10 w-max rounded-xl bg-[#10131c] px-3 py-2.5 text-white shadow-xl"
                  style={tooltipPlacement(yOf(VOLUME[active]), xOf(active), 64)}
                >
                  <div className="text-[11px]! font-semibold text-white/65">
                    {k(`months.${MONTH_KEYS[active]}`)}
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px]! text-white/60">{k("series.buyVolume")}</span>
                      <span className="ml-auto text-[12px]! font-bold tabular-nums">
                        {usd(VOLUME[active])}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px]! text-white/60">{k("series.buyOrders")}</span>
                      <span className="ml-auto text-[12px]! font-bold tabular-nums">
                        {ORDERS[active]}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* X axis. Absolutely placed on each point's own x rather than laid
                out as equal flex cells: the first and last points sit ON the
                plot edges, so evenly-divided cells would centre every label
                half a step away from the marker it names. */}
            <div aria-hidden className="relative h-6 pt-2">
              {MONTH_KEYS.map((month, i) => (
                <span
                  key={month}
                  className="absolute -translate-x-1/2 text-[11px]! leading-4! text-muted"
                  style={{ left: `${xOf(i)}%` }}
                >
                  {k(`months.${month}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
