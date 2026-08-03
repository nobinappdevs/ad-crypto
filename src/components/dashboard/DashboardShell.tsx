"use client";

import { startTransition, useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

const SIDEBAR_COLLAPSED_KEY = "adcrypto_sidebar_collapsed";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Render the server value first, then adopt the stored preference — same
  // hydration-safe pattern as ThemeProvider / LangProvider.
  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {}
    if (stored) startTransition(() => setCollapsed(true));
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    // bg-surface, not bg-bg: the reference design floats white cards on a
    // gray page, and white-on-white loses every panel edge in light mode.
    <div
      className={`min-h-screen bg-surface text-heading md:grid md:grid-cols-[56px_1fr] ${
        collapsed ? "lg:grid-cols-[56px_1fr]" : "lg:grid-cols-[260px_1fr]"
      }`}
    >
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
      <Sidebar
        open={open}
        collapsed={collapsed}
        onClose={() => setOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />
      <main className="flex min-w-0 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        {children}
      </main>
    </div>
  );
}
