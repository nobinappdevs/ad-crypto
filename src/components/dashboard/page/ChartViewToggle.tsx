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
 * Y-axis tick column. The negative block margin is load-bearing: `justify-between`
 * puts the end ticks' outer edges on the container's, so every label sits half a
 * line off its gridline. Pulling the column out by half a line re-centres them.
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
 * Places a tooltip beside its anchor, flipping below when there is no room above —
 * otherwise a tooltip on a tall bar lands on the panel header.
 */
export function tooltipPlacement(topPercent: number, xPercent: number, halfWidth: number) {
  const below = topPercent < 42;
  return {
    left: `clamp(${halfWidth}px, ${xPercent}%, calc(100% - ${halfWidth}px))`,
    top: `${topPercent}%`,
    transform: below ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 14px))",
  };
}
