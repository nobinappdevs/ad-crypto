"use client";

import { useLang } from "@/hooks/useLang";

/**
 * Flips a chart panel between its plot and its table twin. Every chart ships
 * one: a tooltip may enhance a value but must never be the only way to read it.
 */
export function ChartViewToggle({
  on,
  onToggle,
  controls,
}: {
  on: boolean;
  onToggle: () => void;
  controls: string;
}) {
  const { t } = useLang();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-controls={controls}
      className="inline-flex h-7.5 cursor-pointer items-center rounded-lg border border-border px-2.5 text-[11.5px] font-medium text-muted transition hover:border-primary hover:text-heading"
    >
      {t(on ? "dashboard.viewChart" : "dashboard.viewTable")}
    </button>
  );
}

/**
 * Y-axis tick column.
 *
 * The negative block margin is load-bearing: with `justify-between` the first
 * tick's TOP edge and the last tick's BOTTOM edge land on the container's
 * edges, which puts every label half a line-height off the gridline it names.
 * Pulling the column out by half a line (leading-4 -> -my-2) re-centres each
 * label on its line.
 */
export function YAxis({ ticks }: { ticks: number[] }) {
  return (
    <div className="-my-2 flex w-9 shrink-0 flex-col justify-between pb-6 text-right">
      {ticks.map((tick) => (
        <span key={tick} className="pr-2 text-[11px]! leading-4! tabular-nums text-muted">
          {tick}
        </span>
      ))}
    </div>
  );
}

/**
 * Places a tooltip beside its anchor, flipping below when there is not enough
 * room above. Without the flip a tooltip on a tall bar or a high point escapes
 * the top of the plot and lands on the panel header.
 */
export function tooltipPlacement(topPercent: number, xPercent: number, halfWidth: number) {
  const below = topPercent < 42;
  return {
    left: `clamp(${halfWidth}px, ${xPercent}%, calc(100% - ${halfWidth}px))`,
    top: `${topPercent}%`,
    transform: below ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 14px))",
  };
}
