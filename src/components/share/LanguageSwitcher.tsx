"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";

/**
 * `field` uses theme tokens (public navbar, dashboard, auth pages).
 * `hero` is pinned to the always-dark hero scene palette.
 */
type Variant = "field" | "hero";

const TRIGGER: Record<Variant, string> = {
  field: "border-border text-heading hover:bg-surface",
  hero: "border-hero-border text-hero-fg-muted hover:bg-hero-surface hover:text-hero-fg",
};

const MENU: Record<Variant, string> = {
  field: "border-border bg-card",
  hero: "border-hero-border bg-hero-deep",
};

const OPTION: Record<Variant, { active: string; idle: string }> = {
  field: { active: "text-primary font-semibold", idle: "text-heading hover:bg-surface" },
  hero: {
    active: "text-hero-accent-soft font-semibold",
    idle: "text-hero-fg-soft hover:bg-hero-surface hover:text-hero-fg",
  },
};

export function LanguageSwitcher({ variant = "field" }: { variant?: Variant } = {}) {
  const { lang, setLang, languages, t } = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = languages.find((l) => l.code === lang) ?? languages[0];

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition",
          TRIGGER[variant],
        )}
      >
        <span className="inline! text-[14px] leading-none">{active.flag}</span>
        <span className="inline! uppercase">{active.code}</span>
        <ChevronDown size={14} className={cn("transition", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border py-1 shadow-card",
            MENU[variant],
          )}
        >
          {languages.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition",
                  l.code === lang ? OPTION[variant].active : OPTION[variant].idle,
                )}
              >
                <span className="inline! text-[14px] leading-none">{l.flag}</span>
                <span className="inline!">{l.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
