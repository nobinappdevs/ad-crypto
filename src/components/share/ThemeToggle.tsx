"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";

/**
 * `field` uses theme tokens (public navbar, dashboard, auth pages).
 * `hero` is pinned to the always-dark hero scene palette.
 */
type Variant = "field" | "hero";

const STYLES: Record<Variant, string> = {
  field: "border-border text-heading hover:bg-surface",
  // Matches the language switcher — see the note there on why the fill matters.
  hero: "border-hero-border bg-hero-bg/55 text-hero-fg/90 backdrop-blur-md hover:bg-hero-surface-strong hover:text-hero-fg",
};

export function ThemeToggle({ variant = "field" }: { variant?: Variant } = {}) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("theme.toggleToLight") : t("theme.toggleToDark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        STYLES[variant],
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
