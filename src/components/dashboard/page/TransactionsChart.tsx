"use client";

import { useId, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { ChartViewToggle, tooltipPlacement, YAxis } from "./ChartViewToggle";

/**
 * Twelve months x buy / sell / withdraw volume, as a grouped bar chart.
 *
 * Grouped and baseline-anchored rather than the floating segments the source
 * mock used: a bar that does not start at zero encodes its value in a position
 * the reader has to measure against the axis, which is exactly the comparison
 * this panel exists to make easy.
 *
 * The hit target is the whole month COLUMN, not the individual 6px bar — a bar
 * that thin is unhittable, and the reader wants all three numbers for a month
 * anyway. Hovering therefore opens one tooltip carrying the full group.
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

/**
 * Fixed slot order — a series keeps its colour no matter which others are on
 * screen. `token` indexes the validated --chart-N set (see globals.css).
 */
const SERIES = [
  { key: "buyCrypto", token: "var(--chart-1)" },
  { key: "sellCrypto", token: "var(--chart-2)" },
  { key: "withdrawCrypto", token: "var(--chart-3)" },
] as const;

/** [buy, sell, withdraw] per month, in USD moved. */
const DATA: readonly (readonly [number, number, number])[] = [
  [820, 410, 260],
  [1240, 680, 390],
  [1105, 520, 315],
  [1180, 745, 480],
  [690, 355, 210],
  [1265, 705, 425],
  [940, 545, 295],
  [1330, 780, 505],
  [1055, 610, 360],
  [1290, 820, 470],
  [760, 470, 245],
  [905, 560, 330],
];

/** Whole hundreds, so every tick is an integer the 36px axis column can hold. */
const Y_MAX = 1500;
const Y_TICKS = [1500, 1200, 900, 600, 300, 0];

/** Axis and table figures are money; the tooltip repeats them the same way. */
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function TransactionsChart() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const tableId = useId();

  const monthLabel = (i: number) => k(`months.${MONTH_KEYS[i]}`);

  return (
    <div className="px-4 pt-1 pb-5 sm:px-5">
      {/* Legend — always present for more than one series, so identity never
          rests on colour alone. Doubles as the table-view toggle's neighbour. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {SERIES.map((series) => (
            <span key={series.key} className="inline-flex! items-center gap-1.5">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: series.token }}
              />
              <span className="text-[12px]! text-muted">{k(`series.${series.key}`)}</span>
            </span>
          ))}
        </div>
        <ChartViewToggle on={asTable} onToggle={() => setAsTable((v) => !v)} controls={tableId} />
      </div>

      {asTable ? (
        <DataTable id={tableId} monthLabel={monthLabel} k={k} />
      ) : (
        <div className="flex">
          <YAxis ticks={Y_TICKS} />

          <div className="relative min-w-0 flex-1">
            {/* Gridlines: solid hairlines a shade off the surface. Dashes would
                read as thresholds rather than a grid. */}
            <div aria-hidden className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
              {Y_TICKS.map((tick) => (
                <span key={tick} className="h-px w-full" style={{ background: "var(--chart-grid)" }} />
              ))}
            </div>

            <div className="relative flex h-56 items-end sm:h-60">
              {DATA.map((group, i) => (
                <button
                  key={MONTH_KEYS[i]}
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${monthLabel(i)}: ${SERIES.map(
                    (s, si) => `${k(`series.${s.key}`)} ${usd(group[si])}`,
                  ).join(", ")}`}
                  className="group relative flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center gap-0.5 outline-none"
                >
                  {/* Hover band, drawn behind the bars so it reads as a column
                      highlight rather than a fourth series. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0.75 inset-y-0 rounded-md transition-opacity duration-150",
                      active === i ? "opacity-100" : "opacity-0",
                    )}
                    style={{ background: "var(--chart-grid)" }}
                  />
                  {group.map((value, si) => (
                    <span
                      key={SERIES[si].key}
                      aria-hidden
                      className="relative w-1.5 rounded-t-sm transition-[height] duration-300 sm:w-2"
                      style={{
                        height: `${(value / Y_MAX) * 100}%`,
                        background: SERIES[si].token,
                      }}
                    />
                  ))}
                </button>
              ))}

              {active !== null && (
                <div
                  role="status"
                  className="pointer-events-none absolute z-10 w-max rounded-xl bg-[#10131c] px-3 py-2.5 text-white shadow-xl"
                  // Anchored to the group's TALLEST bar: anchoring to the plot
                  // top would sit the card on the bars it is describing.
                  style={tooltipPlacement(
                    100 - (Math.max(...DATA[active]) / Y_MAX) * 100,
                    ((active + 0.5) / DATA.length) * 100,
                    72,
                  )}
                >
                  <div className="text-[11px]! font-semibold text-white/65">
                    {monthLabel(active)}
                  </div>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {SERIES.map((series, si) => (
                      <div key={series.key} className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: series.token }}
                        />
                        <span className="text-[11px]! text-white/60">
                          {k(`series.${series.key}`)}
                        </span>
                        <span className="ml-auto text-[12px]! font-bold tabular-nums">
                          {usd(DATA[active][si])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* X axis. Height is pinned to 24px (8px pad + a 16px line) because
                the gridline stack above is positioned `bottom-6` against this
                same box — let the row size itself and the grid drifts off the
                bar baseline. */}
            <div aria-hidden className="flex h-6 pt-2">
              {MONTH_KEYS.map((_, i) => (
                <span
                  key={MONTH_KEYS[i]}
                  className="min-w-0 flex-1 text-center text-[11px]! leading-4! text-muted"
                >
                  {monthLabel(i)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** The chart's WCAG-clean twin — every plotted value, reachable without hover. */
function DataTable({
  id,
  monthLabel,
  k,
}: {
  id: string;
  monthLabel: (i: number) => string;
  k: (name: string) => string;
}) {
  return (
    <div id={id} className="max-h-64 overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-3 text-start text-[12px]! font-semibold! text-muted">
              {k("month")}
            </th>
            {SERIES.map((series) => (
              <th
                key={series.key}
                className="py-2 pl-3 text-end text-[12px]! font-semibold! text-muted"
              >
                {k(`series.${series.key}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DATA.map((group, i) => (
            <tr key={MONTH_KEYS[i]} className="border-b border-border last:border-b-0">
              <td className="py-2 pr-3 text-[12.5px]!">{monthLabel(i)}</td>
              {group.map((value, si) => (
                <td
                  key={SERIES[si].key}
                  className="py-2 pl-3 text-end text-[12.5px]! font-medium! tabular-nums"
                >
                  {usd(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
