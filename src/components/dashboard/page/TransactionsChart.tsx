"use client";

import { useId, useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { FALLBACK_MONTHS, monthKeyOf, niceScale } from "@/config/chart";
import { ChartViewToggle, tooltipPlacement, YAxis } from "./ChartViewToggle";

/**
 * Buy / sell / withdraw activity per month, grouped bars, from `/user/dashboard`'s
 * `chart` block.
 *
 * The measure is a COUNT of transactions, not money — so the axis is integers and
 * nothing is currency-formatted. Bars are baseline-anchored, since a bar that does
 * not start at zero cannot be compared by eye.
 *
 * The hit target is the whole month column: a 6px bar is unhittable, and the reader
 * wants all three numbers anyway.
 */

/** Fixed slot order, so a series keeps its colour. `token` indexes --chart-N. */
const SERIES = [
  { key: "buyCrypto", token: "var(--chart-1)" },
  { key: "sellCrypto", token: "var(--chart-2)" },
  { key: "withdrawCrypto", token: "var(--chart-3)" },
] as const;

export type TransactionsChartProps = {
  /** The API's own labels; falls back to twelve months when absent. */
  labels?: string[];
  buy?: number[];
  sell?: number[];
  withdraw?: number[];
};

const count = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function TransactionsChart({ labels, buy, sell, withdraw }: TransactionsChartProps) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const tableId = useId();

  /** One row per label, padded so a short series can't shorten the axis. */
  const groups = useMemo(() => {
    const cols = labels?.length ? labels : [...FALLBACK_MONTHS];
    return cols.map((_, i) => [buy?.[i] ?? 0, sell?.[i] ?? 0, withdraw?.[i] ?? 0] as const);
  }, [labels, buy, sell, withdraw]);

  const columns = labels?.length ? labels : [...FALLBACK_MONTHS];

  const scale = useMemo(
    () => niceScale(Math.max(0, ...groups.flatMap((g) => [...g])), { integer: true }),
    [groups],
  );

  /** Translated when the label is a month we know, verbatim otherwise. */
  const labelAt = (i: number) => {
    const raw = columns[i] ?? "";
    const key = monthKeyOf(raw);
    return key ? k(`months.${key}`) : raw;
  };

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
        <div id={tableId} className="max-h-64 overflow-auto">
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
              {groups.map((group, i) => (
                <tr key={columns[i]} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 text-[12.5px]!">{labelAt(i)}</td>
                  {group.map((value, si) => (
                    <td
                      key={SERIES[si].key}
                      className="py-2 pl-3 text-end text-[12.5px]! font-medium! tabular-nums"
                    >
                      {count(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex">
          <YAxis ticks={scale.ticks} />

          <div className="relative min-w-0 flex-1">
            {/* Gridlines: solid hairlines a shade off the surface. Dashes would
                read as thresholds rather than a grid. */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
            >
              {scale.ticks.map((tick) => (
                <span key={tick} className="h-px w-full" style={{ background: "var(--chart-grid)" }} />
              ))}
            </div>

            <div className="relative flex h-56 items-end sm:h-60">
              {groups.map((group, i) => (
                <button
                  key={columns[i]}
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${labelAt(i)}: ${SERIES.map(
                    (s, si) => `${k(`series.${s.key}`)} ${count(group[si])}`,
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
                        height: `${(value / scale.max) * 100}%`,
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
                    100 - (Math.max(...groups[active]) / scale.max) * 100,
                    ((active + 0.5) / groups.length) * 100,
                    72,
                  )}
                >
                  <div className="text-[11px]! font-semibold text-white/65">{labelAt(active)}</div>
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
                          {count(groups[active][si])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* X axis. Height pinned to 24px — the gridlines above are positioned
                `bottom-6` against this box, so a self-sizing row drifts. */}
            <div aria-hidden className="flex h-6 pt-2">
              {columns.map((column, i) => (
                <span
                  key={column}
                  className="min-w-0 flex-1 truncate text-center text-[11px]! leading-4! text-muted"
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
