"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/components/ui/cn";

/**
 * The pieces every trade page (Buy / Sell / Exchange) is built from. They live
 * here rather than in one of the pages so the three stay identical — the amount
 * row in particular is each page's main control, and three drifting copies of it
 * is how a form ends up with three different focus rings.
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
 * The big number row. `inputMode="decimal"` keeps a phone on the numeric pad,
 * and the value is a plain string so a half-typed "0." survives re-render.
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
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suffix?: string;
  selector?: ReactNode;
  footer?: ReactNode;
  error?: boolean;
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
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={onBlur}
          inputMode="decimal"
          placeholder="0.00"
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-[26px] font-bold tracking-[-0.02em] tabular-nums text-heading outline-none placeholder:text-muted/60"
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
