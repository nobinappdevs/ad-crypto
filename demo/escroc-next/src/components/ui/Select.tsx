"use client";

import { useId, useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * A single option in a {@link Select}.
 *
 * Rich fields let one component cover every dropdown shape in the app:
 * - generic option → `icon` + `label` + `sub`
 * - currency/wallet → `image` (flag) + `label` (code) + `badge` (type) + `sub` (name) + `right` (balance)
 * - gateway        → `image` (logo, `imageRounded:"md"`) + `label` + `badge` (type) + `sub` (limits)
 */
export type SelectOption = {
  value: string;
  label: string;
  /**
   * Unique React key, for lists where `value` (e.g. a bank/branch code) isn't
   * guaranteed unique across entries — falls back to `value` when absent.
   */
  id?: string;
  sub?: string;
  badge?: string;
  icon?: ReactNode;
  /** Remote image (flag/logo) — auto-sized per context. */
  image?: string;
  /** Rendered when `image` is absent (e.g. a currency-symbol badge). */
  imageFallback?: ReactNode;
  imageRounded?: "full" | "md";
  /** Right-aligned content in the option row (e.g. a balance). */
  right?: ReactNode;
  /** Extra text matched by the search box (defaults to label + sub). */
  keywords?: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Show a search box. Defaults to auto (on when there are > 7 options). */
  searchable?: boolean;
  disabled?: boolean;
  /** Persistent trigger icon shown regardless of selection (e.g. a MapPin). */
  leftIcon?: ReactNode;
  /** `field` = full-width bordered box; `chip` = compact borderless selector. */
  variant?: "field" | "chip";
  /** Menu width for the `chip` variant (px). */
  menuWidth?: number;
  /** Gap between the trigger and the menu, in px (default 8). */
  menuGap?: number;
  className?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  required?: boolean;
  "aria-label"?: string;
};

const MENU_H = 320; // rough popup height used to decide flip-up vs flip-down

const MENU_SCROLL =
  "scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent";

export function Select({
  value,
  onChange,
  options,
  placeholder = "—",
  searchable,
  disabled,
  leftIcon,
  variant = "field",
  menuWidth = 288,
  menuGap = 8,
  className = "",
  searchPlaceholder,
  noResultsText,
  required,
  "aria-label": ariaLabel,
}: SelectProps) {
  const { t } = useLang();
  const searchPh = searchPlaceholder ?? t("common.search");
  const noRes = noResultsText ?? t("common.noResults");
  const baseId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [rect, setRect] = useState<{ top: number; bottom: number; left: number; right: number; width: number; dropUp: boolean } | null>(null);

  const showSearch = searchable ?? options.length > 7;
  const sel = options.find((o) => o.value === value);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => `${o.label} ${o.sub ?? ""} ${o.keywords ?? ""}`.toLowerCase().includes(q))
    : options;

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom;
    const dropUp = spaceBelow < MENU_H + 16 && r.top > spaceBelow;
    setRect({ top: r.top, bottom: r.bottom, left: r.left, right: Math.max(12, window.innerWidth - r.right), width: r.width, dropUp });
  }, []);

  // Reset transient state on open/close — adjust-state-during-render (no effect).
  const [prevOpen, setPrevOpen] = useState(false);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      const i = options.findIndex((o) => o.value === value);
      setActiveIndex(i < 0 ? 0 : i);
    }
  }

  const openMenu = () => {
    if (disabled) return;
    place();
    setOpen(true);
  };

  // Outside-click / Escape / reposition while open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const rep = () => place();
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", rep);
    window.addEventListener("scroll", rep, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", rep);
      window.removeEventListener("scroll", rep, true);
    };
  }, [open, place]);

  // Focus the search box on open (keyboard nav then flows from the input).
  useEffect(() => {
    if (open && showSearch) inputRef.current?.focus();
  }, [open, showSearch]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  const move = (delta: number) => {
    if (!filtered.length) return;
    setActiveIndex((i) => {
      let n = i;
      for (let step = 0; step < filtered.length; step++) {
        n = (n + delta + filtered.length) % filtered.length;
        if (!filtered[n]?.disabled) break;
      }
      return n;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); move(1); break;
      case "ArrowUp": e.preventDefault(); move(-1); break;
      case "Home": e.preventDefault(); setActiveIndex(0); break;
      case "End": e.preventDefault(); setActiveIndex(filtered.length - 1); break;
      case "Enter": {
        e.preventDefault();
        const cur = filtered[activeIndex];
        if (cur && !cur.disabled) choose(cur.value);
        break;
      }
      case "Escape": e.preventDefault(); setOpen(false); btnRef.current?.focus(); break;
      case "Tab": setOpen(false); break;
    }
  };

  const chip = variant === "chip";

  /* trigger icon: persistent leftIcon wins, else the selected option's visual */
  const trigIcon =
    leftIcon ??
    (sel?.image ? (
      // eslint-disable-next-line @next/next/no-img-element -- remote flag/logo in a static-export app
      <img src={sel.image} alt="" className={`${chip ? "h-5 w-5" : "h-6 w-6"} shrink-0 object-cover ${sel.imageRounded === "md" ? "rounded-md" : "rounded-full"}`} />
    ) : (
      sel?.imageFallback ?? sel?.icon ?? null
    ));

  const triggerCls = chip
    ? "flex h-full shrink-0 cursor-pointer items-center gap-2 border-l border-border px-3.5 text-sm font-bold text-primary transition  disabled:cursor-not-allowed disabled:opacity-50"
    : "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-left text-sm font-medium text-heading transition hover:border-primary/50 focus:border-primary focus:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50";

  const activeId = open && filtered[activeIndex] ? `${baseId}-opt-${activeIndex}` : undefined;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={showSearch ? undefined : onKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-listbox` : undefined}
        aria-activedescendant={showSearch ? undefined : activeId}
        aria-label={ariaLabel}
        aria-required={required}
        className={`${triggerCls} ${className}`}
      >
        {trigIcon}
        <span className={`min-w-0 flex-1 truncate ${chip ? "" : sel ? "" : "text-muted"}`}>{sel?.label ?? placeholder}</span>
        <ChevronDown size={chip ? 14 : 16} strokeWidth={chip ? 2.5 : 2} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && rect && createPortal(
        <div
          ref={popRef}
          id={`${baseId}-listbox`}
          style={{
            position: "fixed",
            ...(chip ? { right: rect.right, width: menuWidth } : { left: rect.left, width: rect.width }),
            ...(rect.dropUp ? { bottom: window.innerHeight - rect.top + menuGap } : { top: rect.bottom + menuGap }),
          }}
          className="z-100 flex max-h-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/40"
        >
          {showSearch && (
            <div className="border-b border-border p-2">
              <div className="relative">
                <Search size={14} strokeWidth={2} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                  onKeyDown={onKeyDown}
                  placeholder={searchPh}
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary"
                  aria-controls={`${baseId}-listbox`}
                  aria-activedescendant={activeId}
                />
              </div>
            </div>
          )}

          <ul role="listbox" className={`flex-1 overflow-y-auto p-1.5 ${MENU_SCROLL}`}>
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">{noRes}</li>
            ) : (
              filtered.map((o, i) => {
                const active = o.value === value;
                const highlighted = i === activeIndex;
                return (
                  <li key={o.id ?? o.value} role="option" aria-selected={active} id={`${baseId}-opt-${i}`}>
                    <button
                      ref={(el) => { optionRefs.current[i] = el; }}
                      type="button"
                      disabled={o.disabled}
                      onClick={() => choose(o.value)}
                      onMouseEnter={() => setActiveIndex(i)}
                      tabIndex={-1}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        active ? "bg-primary/10" : highlighted ? "bg-black/5 dark:bg-white/5" : ""
                      }`}
                    >
                      {o.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote flag/logo in a static-export app
                        <img src={o.image} alt="" className={`h-7 w-7 shrink-0 object-cover ${o.imageRounded === "md" ? "rounded-md" : "rounded-full"}`} />
                      ) : (
                        o.imageFallback ?? o.icon ?? null
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className={`truncate text-sm font-semibold ${active ? "text-primary" : "text-heading"}`}>{o.label}</span>
                          {o.badge && <span className="rounded bg-black/5 px-1.5 text-[10px] font-semibold uppercase text-muted dark:bg-white/10">{o.badge}</span>}
                        </span>
                        {o.sub && <span className="block truncate text-xs text-muted">{o.sub}</span>}
                      </span>
                      {o.right && <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-heading">{o.right}</span>}
                      {active && <Check size={15} strokeWidth={3} className="shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}

export default Select;
