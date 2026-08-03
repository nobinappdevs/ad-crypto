"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/components/ui/cn";

export type SelectOption = {
  value: string;
  /** Main line. */
  label: string;
  /** Second line under the label, in the list and optionally the trigger. */
  hint?: string;
  /** Trailing text on the row — a price, a fee. */
  meta?: string;
  icon?: ReactNode;
};

/**
 * Listbox with room for an icon, a sub-label and a trailing figure per row —
 * the things a native `<select>` cannot render, and which a coin or network
 * picker needs in order to be readable at a glance.
 *
 * Closes on outside pointer-down and on Escape, and returns focus to the
 * trigger so keyboard users are not dropped at the top of the document.
 */
export function SelectMenu({
  value,
  options,
  onChange,
  label,
  className,
  showHintInTrigger = true,
  placeholder,
  searchable = false,
  searchPlaceholder,
  emptyText,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
  showHintInTrigger?: boolean;
  /**
   * Shown when `value` matches no option. Without it the trigger falls back to the
   * first option, which would claim a choice the user has not made — fine for a
   * coin picker that always has a selection, wrong for a required form field.
   */
  placeholder?: string;
  /** Filter box at the top of the list. For long lists — countries, coins. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const match = options.find((option) => option.value === value);
  const selected = match ?? (placeholder ? undefined : options[0]);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) =>
        `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle),
      )
    : options;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          "flex h-13 w-full cursor-pointer items-center gap-3 rounded-xl border bg-surface px-3 text-left transition",
          open ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/60",
        )}
      >
        {selected?.icon}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[14px] font-semibold",
              selected ? "text-heading" : "font-medium text-muted",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          {showHintInTrigger && selected?.hint && (
            <span className="block truncate text-[11.5px] text-muted">{selected.hint}</span>
          )}
        </span>
        {selected?.meta && (
          <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{selected.meta}</span>
        )}
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-2 flex max-h-72 w-full flex-col overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-[0_20px_50px_rgb(2_10_22/0.18)]"
        >
          {searchable && (
            // Sticky rather than scrolling away: with 240 countries the box the
            // user is typing into has to stay in view.
            <div className="mb-1 flex shrink-0 items-center gap-2 rounded-lg bg-surface px-2.5">
              <Search size={14} aria-hidden className="shrink-0 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder ?? label}
                className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-heading outline-none placeholder:text-muted"
              />
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.length === 0 && (
              <p className="px-2.5 py-3 text-[12.5px]! text-muted">{emptyText}</p>
            )}
            {visible.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition",
                    active ? "bg-primary/10" : "hover:bg-black/4 dark:hover:bg-white/6",
                  )}
                >
                  {option.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-heading">
                      {option.label}
                    </span>
                    {option.hint && (
                      <span className="block truncate text-[11.5px] text-muted">{option.hint}</span>
                    )}
                  </span>
                  {option.meta && (
                    <span className="shrink-0 text-[12.5px] tabular-nums text-muted">
                      {option.meta}
                    </span>
                  )}
                  {active && <Check size={15} className="shrink-0 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
