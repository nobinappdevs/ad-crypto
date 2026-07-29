"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LayoutDashboard, Wallet, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";

const NAV_ITEMS = [{ href: "/dashboard", labelKey: "dashboard.welcomeTitle", icon: LayoutDashboard }];

export function Sidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapsed,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}) {
  const { t } = useLang();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:z-0 md:h-screen md:w-14 md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-14" : "lg:w-65",
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
        <Link href="/" className="inline-flex! items-center gap-2 overflow-hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet size={16} />
          </span>
          {!collapsed && (
            <span className="inline! truncate text-[15px] font-bold text-heading">
              {t("brand.name")}
            </span>
          )}
        </Link>
        <button type="button" onClick={onClose} className="text-heading md:hidden" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex! items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-heading hover:bg-black/4 dark:hover:bg-white/6",
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="inline! truncate">{t(labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="hidden items-center justify-center gap-2 border-t border-border py-3 text-muted transition hover:text-heading md:flex"
        aria-label="Toggle sidebar width"
      >
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>
    </aside>
  );
}
