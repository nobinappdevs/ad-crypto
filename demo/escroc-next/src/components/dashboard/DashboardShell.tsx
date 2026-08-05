"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/dashboard/Navbar";
import { PushNotifications } from "@/components/dashboard/PushNotifications";
import { RoleProvider } from "@/components/context/RoleContext";

export function DashboardShell({ children }) {
  const [open, setOpen] = useState(false);

  /* restore the user's collapse preference (lazy — runs once on the client) */
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed") === "1",
  );

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <RoleProvider>
      <div
        className={`min-h-screen bg-bg text-heading dark:bg-[#1118288f] md:grid md:grid-cols-[56px_1fr] ${
          collapsed ? "lg:grid-cols-[56px_1fr]" : "lg:grid-cols-[260px_1fr]"
        }`}
      >
        {/* Mobile drawer backdrop */}
        {open && (
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}

        <Sidebar
          open={open}
          collapsed={collapsed}
          onClose={() => setOpen(false)}
          onToggleCollapse={toggleCollapsed}
        />

        <main className="flex min-w-0 flex-col">
          <Navbar onMenu={() => setOpen(true)} />
          {children}
        </main>

        {/* Realtime push-notification registration (Pusher Beams) */}
        <PushNotifications />
      </div>
    </RoleProvider>
  );
}
