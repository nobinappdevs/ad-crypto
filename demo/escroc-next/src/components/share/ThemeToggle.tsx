"use client";

import { useTheme } from "@/hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const isDark = theme === "dark";

  return (
    <div
      role="group"
      aria-label={t("theme.toggle")}
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-1"
    >
      {/* Sun — click to set light mode */}
      <button
        type="button"
        onClick={() => isDark && toggleTheme()}
        aria-label={t("theme.light")}
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isDark ? "bg-primary text-white" : "text-muted hover:text-heading"}`}
      >
        <Sun size={14} strokeWidth={2.2} aria-hidden />
      </button>

      {/* Moon — click to set dark mode */}
      <button
        type="button"
        onClick={() => !isDark && toggleTheme()}
        aria-label={t("theme.dark")}
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isDark ? "bg-primary text-white" : "text-muted hover:text-heading"}`}
      >
        <Moon size={14} strokeWidth={2.2} aria-hidden />
      </button>
    </div>
  );
}
