"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { FALLBACK_MONTHS, monthKeyOf, niceScale } from "@/config/chart";
import { ChartViewToggle, tooltipPlacement, YAxis } from "./ChartViewToggle";

/**
 * A year of buy orders as a single-series line, from `chart.buy_data`.
 *
 * ONE measure on ONE axis: two y-scales on one plot would imply a relationship
 * that is not in the data, and the endpoint sends a single number per month anyway.
 * It plots the same series the grouped chart's first bar does — this one reads as a
 * trend, that one as a comparison. No legend; the panel title names it.
 */

export type BuyCryptoChartProps = {
  labels?: string[];
  buy?: number[];
};

const count = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function BuyCryptoChart({ labels, buy }: BuyCryptoChartProps) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const plotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const tableId = useId();

  // Memoised because it seeds `values` below: a fresh array each render would
  // re-run that memo every time and defeat the point of it.
  const columns = useMemo(() => (labels?.length ? labels : [...FALLBACK_MONTHS]), [labels]);
  const values = useMemo(() => columns.map((_, i) => buy?.[i] ?? 0), [columns, buy]);
  const scale = useMemo(() => niceScale(Math.max(0, ...values), { integer: true }), [values]);

  const labelAt = (i: number) => {
    const raw = columns[i] ?? "";
    const key = monthKeyOf(raw);
    return key ? k(`months.${key}`) : raw;
  };

  // A one-point series has no line to draw and would divide by zero below.
  const span = Math.max(1, values.length - 1);
  const xOf = (i: number) => (i / span) * 100;
  const yOf = (v: number) => 100 - (v / scale.max) * 100;

  const linePath = values.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(v)}`).join(" ");

  // Snap to the nearest point rather than requiring a hit on the 10px marker.
  const onMove = (e: React.PointerEvent) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setActive(Math.round(ratio * span));
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
                  {k("series.buyCrypto")}
                </th>
              </tr>
            </thead>
            <tbody>
              {values.map((value, i) => (
                <tr key={columns[i]} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 text-[12.5px]!">{labelAt(i)}</td>
                  <td className="py-2 pl-3 text-end text-[12.5px]! font-medium! tabular-nums">
                    {count(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex">
          <YAxis ticks={scale.ticks} />

          <div className="relative min-w-0 flex-1">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
            >
              {scale.ticks.map((tick) => (
                <span key={tick} className="h-px w-full" style={{ background: "var(--chart-grid)" }} />
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
                  d={linePath}
                  fill="none"
                  stroke="var(--chart-3)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Markers are HTML, not SVG circles — the viewBox is stretched with
                  `preserveAspectRatio="none"`, which would squash a circle. */}
              {values.map((value, i) => (
                <span
                  key={columns[i]}
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
                  style={tooltipPlacement(yOf(values[active]), xOf(active), 64)}
                >
                  <div className="text-[11px]! font-semibold text-white/65">{labelAt(active)}</div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[11px]! text-white/60">{k("series.buyCrypto")}</span>
                    <span className="ml-auto text-[12px]! font-bold tabular-nums">
                      {count(values[active])}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* X axis, absolutely placed on each point's own x: the end points sit ON
                the plot edges, so equal cells would offset every label. */}
            <div aria-hidden className="relative h-6 pt-2">
              {columns.map((column, i) => (
                <span
                  key={column}
                  className="absolute -translate-x-1/2 text-[11px]! leading-4! text-muted"
                  style={{ left: `${xOf(i)}%` }}
                >
                  {labelAt(i)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
