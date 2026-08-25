"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/components/ui/cn";

export type SelectOption = {
  value: string;
  /** Main line. */
  label: string;
  /** React key, when `value` is not unique across entries. Falls back to `value`. */
  id?: string;
  /** Second line under the label, in the list and optionally the trigger. */
  hint?: string;
  /** Trailing text on the row — a price, a fee. */
  meta?: string;
  /** Short uppercase tag beside the label — a network type, a document class. */
  badge?: string;
  icon?: ReactNode;
  /** Extra text the search box matches, on top of label + hint. */
  keywords?: string;
  /** Listed but not choosable — a coin with no route, a suspended method. */
  disabled?: boolean;
};

/** Rough menu height, used to decide whether the list opens up or down. */
const MENU_HEIGHT = 320;

/** Gap between trigger and menu. */
const MENU_GAP = 8;

/** Smallest gap kept between the menu and the viewport edge. */
const EDGE = 12;

/** Floor for the menu width — a narrow trigger must not squeeze the label column. */
const MENU_MIN_WIDTH = 260;

const MENU_SCROLL =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent";

type Anchor = {
  top: number;
  bottom: number;
  left: number;
  width: number;
  /** Not enough room below, and more room above — open upwards. */
  dropUp: boolean;
};

/**
 * Listbox with an icon, a sub-label and a trailing figure per row.
 *
 * Portalled to `<body>` so `overflow-hidden` cards cannot clip it; it tracks on
 * scroll/resize and flips above when short of room. Fully keyboard-operable.
 */
export function SelectMenu({
  value,
  options,
  onChange,
  label,
  className,
  showHintInTrigger = true,
  showIconInTrigger = true,
  showMetaInTrigger = true,
  bare = false,
  menuMinWidth = MENU_MIN_WIDTH,
  placeholder,
  searchable = false,
  searchPlaceholder,
  emptyText,
  disabled,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label: string;
  className?: string;
  showHintInTrigger?: boolean;
  /** Off for a compact trigger whose label already identifies the choice. */
  showIconInTrigger?: boolean;
  /** Off for a narrow trigger, where the figure would crowd out the label. */
  showMetaInTrigger?: boolean;
  /** Drops the trigger frame, for a menu sitting inside another field (dial code). */
  bare?: boolean;
  /** Floor for the menu's width, in px. Widened past `MENU_MIN_WIDTH`, never under. */
  menuMinWidth?: number;
  /** Shown when `value` matches no option, so the trigger claims no choice. */
  placeholder?: string;
  /** Filter box at the top of the list. For long lists — countries, coins. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** The keyboard highlight, which moves independently of the selection. */
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const match = options.find((option) => option.value === value);
  const selected = match ?? (placeholder ? undefined : options[0]);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) =>
        `${option.label} ${option.hint ?? ""} ${option.keywords ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : options;

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;

    // A menu is normally exactly as wide as its field. A narrow trigger — the dial
    // code in front of a phone number — would give a 100px list to read country
    // names in, so it may ask for more and is then nudged back inside the viewport.
    const width = Math.max(rect.width, menuMinWidth);
    const left = Math.min(Math.max(EDGE, rect.left), Math.max(EDGE, window.innerWidth - width - EDGE));

    setAnchor({
      top: rect.top,
      bottom: rect.bottom,
      left,
      width,
      dropUp: below < MENU_HEIGHT + 16 && rect.top > below,
    });
  }, [menuMinWidth]);

  // Reset the query and highlight on open, during render — an effect would paint
  // one frame with the previous search still in the box.
  const [wasOpen, setWasOpen] = useState(false);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      const index = options.findIndex((option) => option.value === value);
      setActiveIndex(index < 0 ? 0 : index);
    }
  }

  function openMenu() {
    if (disabled) return;
    place();
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Outside pointer-down closes; scroll and resize keep the menu on the field.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const reposition = () => place();

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", reposition);
    // Capture phase: the field may sit inside a scrolling panel whose scroll
    // events never reach `window` in the bubble phase.
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, place]);

  // With a search box the keyboard lives in the input, so focus it on open.
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (open) rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function choose(option: SelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    close();
  }

  /** Step the highlight, skipping disabled rows and wrapping at the ends. */
  function move(delta: number) {
    if (visible.length === 0) return;
    setActiveIndex((current) => {
      let next = current;
      for (let step = 0; step < visible.length; step++) {
        next = (next + delta + visible.length) % visible.length;
        if (!visible[next]?.disabled) break;
      }
      return next;
    });
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(visible.length - 1);
        break;
      case "Enter": {
        e.preventDefault();
        const option = visible[activeIndex];
        if (option) choose(option);
        break;
      }
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const listId = `${baseId}-list`;
  const activeId = open && visible[activeIndex] ? `${baseId}-opt-${activeIndex}` : undefined;

  return (
    // The wrapper carries the caller's sizing (`w-38 shrink-0` beside an amount
    // field) so it never collides with the trigger's own `w-full`.
    <div className={cn("min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        // With a search box the input owns the highlight, so the trigger must not
        // also claim it — two active descendants is one too many for a reader.
        aria-activedescendant={searchable ? undefined : activeId}
        aria-label={label}
        className={cn(
          "flex h-13 w-full cursor-pointer items-center text-left transition disabled:cursor-not-allowed disabled:opacity-60",
          bare
            ? "gap-1.5 px-3 text-heading hover:text-primary"
            : cn(
                "gap-3 rounded-xl border bg-surface px-3",
                open
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/60",
              ),
        )}
      >
        {showIconInTrigger && selected?.icon}
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
        {showMetaInTrigger && selected?.meta && (
          <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{selected.meta}</span>
        )}
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open &&
        anchor &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: anchor.left,
              width: anchor.width,
              ...(anchor.dropUp
                ? { bottom: window.innerHeight - anchor.top + MENU_GAP }
                : { top: anchor.bottom + MENU_GAP }),
            }}
            className="z-100 flex max-h-72 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-[0_20px_50px_rgb(2_10_22/0.18)]"
          >
            {searchable && (
              // Outside the scroll area, not inside it: with 240 countries the box
              // the user is typing into has to stay in view.
              <div className="mb-1 flex shrink-0 items-center gap-2 rounded-lg bg-surface px-2.5">
                <Search size={14} aria-hidden className="shrink-0 text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder ?? label}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-heading outline-none placeholder:text-muted"
                />
              </div>
            )}

            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              // `overflow-x-hidden` explicitly: setting only `overflow-y` leaves the
              // other axis computing to `auto`, and one long trailing figure was
              // enough to grow a horizontal scrollbar across the whole list.
              className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden", MENU_SCROLL)}
            >
              {visible.length === 0 && (
                <li className="px-2.5 py-3 text-[12.5px] text-muted">{emptyText}</li>
              )}
              {visible.map((option, index) => {
                const active = option.value === value;
                const highlighted = index === activeIndex;
                return (
                  <li
                    key={option.id ?? option.value}
                    role="option"
                    aria-selected={active}
                    id={`${baseId}-opt-${index}`}
                  >
                    <button
                      ref={(el) => {
                        rowRefs.current[index] = el;
                      }}
                      type="button"
                      disabled={option.disabled}
                      tabIndex={-1}
                      onClick={() => choose(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                        active
                          ? "bg-primary/10"
                          : highlighted
                            ? "bg-black/4 dark:bg-white/6"
                            : "",
                      )}
                    >
                      {option.icon}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "truncate text-[13.5px] font-semibold",
                              active ? "text-primary" : "text-heading",
                            )}
                          >
                            {option.label}
                          </span>
                          {option.badge && (
                            <span className="shrink-0 rounded bg-black/5 px-1.5 text-[10px]! font-semibold! tracking-wide text-muted uppercase dark:bg-white/10">
                              {option.badge}
                            </span>
                          )}
                        </span>
                        {option.hint && (
                          <span className="block truncate text-[11.5px] text-muted">
                            {option.hint}
                          </span>
                        )}
                      </span>
                      {option.meta && (
                        <span className="shrink-0 text-[12.5px] whitespace-nowrap tabular-nums text-muted">
                          {option.meta}
                        </span>
                      )}
                      {active && (
                        <Check size={15} strokeWidth={3} className="shrink-0 text-primary" aria-hidden />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
