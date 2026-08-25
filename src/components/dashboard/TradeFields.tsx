"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/components/ui/cn";

/**
 * The pieces every trade page (Buy / Sell / Exchange) is built from — shared so
 * the three stay identical rather than drifting apart.
 */

export function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="text-[13px] font-semibold text-heading">{children}</span>
      {hint && (
        <span className="relative inline-flex">
          <Info size={13} aria-hidden className="text-muted" />
          <span className="sr-only">{hint}</span>
        </span>
      )}
    </div>
  );
}

/**
 * The big number row. `inputMode="decimal"` keeps a phone on the numeric pad, and
 * the value stays a string so a half-typed "0." survives re-render.
 */
export function AmountField({
  label,
  value,
  onChange,
  onBlur,
  suffix,
  selector,
  footer,
  error,
  readOnly,
  disabled,
  className,
}: {
  label: string;
  value: string;
  /** Omitted on a read-only field, which has nothing to report. */
  onChange?: (value: string) => void;
  onBlur?: () => void;
  suffix?: string;
  selector?: ReactNode;
  footer?: ReactNode;
  error?: boolean;
  /** A derived side the user cannot type into — the receiving half of a swap. */
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-3.5 transition focus-within:ring-2",
        error
          ? "border-hero-neg focus-within:ring-hero-neg/25"
          : "border-border focus-within:border-primary focus-within:ring-primary/20",
        className,
      )}
    >
      <label className="block text-[12px] font-medium text-muted">{label}</label>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={onBlur}
          readOnly={readOnly}
          disabled={disabled}
          inputMode="decimal"
          placeholder="0.00"
          aria-label={label}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[26px] font-bold tracking-[-0.02em] tabular-nums text-heading outline-none placeholder:text-muted/60 disabled:opacity-60",
            readOnly && "cursor-default",
          )}
        />
        {selector}
        {suffix && (
          <span className="shrink-0 rounded-lg bg-black/5 px-2.5 py-1.5 text-[13px] font-bold text-heading dark:bg-white/8">
            {suffix}
          </span>
        )}
      </div>
      {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
    </div>
  );
}

/** One line of the order summary list. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12.5px]! text-muted">{label}</dt>
      <dd className="text-[12.5px]! font-semibold! tabular-nums">{children}</dd>
    </div>
  );
}

/** The figures a choice decides: label on the left, value on the right. */
export function Figures({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-2.5 flex flex-col gap-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <dt className="text-[12px]! text-muted">{label}</dt>
          <dd className="text-[12px]! font-semibold! tabular-nums text-heading">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Segmented choice                                                            */
/* -------------------------------------------------------------------------- */

/** The control's own padding and the gap between its cells, in px. */
const SEG_PAD = 6;
const SEG_GAP = 6;

/**
 * The source/destination switch at the top of Buy and Sell.
 *
 * The highlight is ONE sliding element, not a background swapped between cells, so
 * the eye has something to follow. Positioned with `inset-inline-start` rather
 * than a transform, which makes it correct under RTL for free.
 */
export function SegmentedChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  // `NoInfer` everywhere but `value`, so T is read off the current value — an
  // inline options array would widen it to plain `string`.
  options: readonly { value: NoInfer<T>; label: string; hint?: string; icon?: ReactNode }[];
  onChange: (value: NoInfer<T>) => void;
}) {
  const count = options.length;
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  /** One cell's width, as the browser will compute it for the grid. */
  const cell = `((100% - ${SEG_PAD * 2 + SEG_GAP * (count - 1)}px) / ${count})`;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative grid gap-1.5 rounded-2xl border border-border bg-surface p-1.5"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-xl bg-primary shadow-[0_8px_20px_rgb(var(--primary__color)/0.32)] transition-[inset-inline-start] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          width: `calc(${cell})`,
          insetInlineStart: `calc(${index} * (${cell} + ${SEG_GAP}px) + ${SEG_PAD}px)`,
        }}
      />

      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            // `relative` puts the label above the sliding pill, which is a sibling
            // painted first — without it the highlight covers the text.
            className={cn(
              "relative cursor-pointer rounded-xl px-3 py-2.5 text-center transition-colors duration-200",
              active ? "text-white" : "text-muted hover:text-heading",
            )}
          >
            {/* `text-inherit` is load-bearing: the base stylesheet colours every
                bare `span` with `text-body`, so without it this label stays dark
                slate on top of the blue pill while the icon (currentColor) turns
                white. Inheriting also carries the button's hover colour. */}
            <span className="flex items-center justify-center gap-2 text-[13.5px] font-semibold text-inherit">
              {option.icon}
              {option.label}
            </span>
            {option.hint && (
              <span
                className={cn(
                  "mt-0.5 block text-[11.5px] transition-colors duration-200",
                  active ? "text-white/80" : "text-muted",
                )}
              >
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Quick-fill chips under an amount field. */
export function PercentChips({
  percents,
  maxLabel,
  onPick,
}: {
  percents: readonly number[];
  maxLabel: string;
  onPick: (pct: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {percents.map((pct) => (
        <button
          key={pct}
          type="button"
          onClick={() => onPick(pct)}
          className="cursor-pointer rounded-lg border border-border px-2 py-1 text-[11.5px] font-semibold text-muted transition hover:border-primary hover:text-primary"
        >
          {pct === 100 ? maxLabel : `${pct}%`}
        </button>
      ))}
    </div>
  );
}

/** The pulsing "rate is live" pill that sits beside every trade page's title. */
export function LiveRatePill({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
      <span aria-hidden className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-hero-mint opacity-70" />
        <span className="relative h-2 w-2 rounded-full bg-hero-mint" />
      </span>
      <span className="text-[12px]! text-muted">{label}</span>
      <span className="text-[13px]! font-bold! tabular-nums">{children}</span>
    </div>
  );
}
