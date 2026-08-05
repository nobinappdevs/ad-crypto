"use client";

// Theme state, persisted to localStorage("escroc_theme") and applied to
// <html data-theme="...">. The *initial* attribute is set by the blocking
// inline script in app/layout.tsx (before paint) so there is no flash; this
// provider just reads what the script decided, then handles toggling.

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const THEME_STORAGE_KEY = "escroc_theme";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function setDocumentTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // "light" on both server and first client render so hydration matches; the
  // real value is read from the DOM right after mount.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "light";
    startTransition(() => setThemeState(current));
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    setDocumentTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors (private mode, etc.).
    }
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside a <ThemeProvider>");
  }
  return ctx;
}
