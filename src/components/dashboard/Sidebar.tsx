"use client";

import Link from "next/link";
import { useState, type ComponentType, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  HandCoins,
  LayoutGrid,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/components/ui/cn";
import { Logo, LogoMark } from "@/components/share/Logo";

/**
 * Only `/dashboard` is a real route; everything else in the reference design is
 * a section that doesn't exist yet, so those rows render as buttons — same
 * look, no dead navigation. A group with `children` expands in place.
 */
type NavEntry = {
  key: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  href?: string;
  children?: string[];
};

const NAV: NavEntry[] = [
  { key: "dashboard", icon: LayoutGrid, href: "/dashboard" },
  { key: "buyCrypto", icon: ShoppingCart, href: "/dashboard/buy-crypto" },
  { key: "sellCrypto", icon: HandCoins, href: "/dashboard/sell-crypto" },
  { key: "withdrawCrypto", icon: ArrowDownToLine, href: "/dashboard/withdraw-crypto" },
  { key: "exchangeCrypto", icon: ArrowLeftRight, href: "/dashboard/exchange-crypto" },
  { key: "myCards", icon: CreditCard, href: "/dashboard/my-cards" },
  { key: "transactions", icon: ReceiptText, children: ["all", "pending", "statements"] },
];

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
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  /**
   * Everything textual hides wherever the rail is icon-only: md-lg always
   * (pinned to 56px whatever `collapsed` says), lg+ when collapsed.
   */
  const label = (node: ReactNode) =>
    !collapsed && <span className="inline! min-w-0 truncate md:hidden! lg:inline!">{node}</span>;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-65 flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:z-0 md:h-screen md:w-14 md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        collapsed ? "lg:w-14" : "lg:w-65",
      )}
    >
      {/* ---- Logo row. The collapse toggle lives up here, as in the design. */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-3.5">
        {/* The site wordmark, dropping to the hexagon alone wherever the rail is
            icon-only — at 56px the full lockup would render its lettering about
            twelve pixels tall. */}
        <Link href="/" className="inline-flex! items-center overflow-hidden">
          {collapsed ? (
            <LogoMark />
          ) : (
            <>
              <span className="block md:hidden lg:block">
                <Logo className="max-w-33 lg:max-w-33 xl:max-w-33" />
              </span>
              <span className="hidden md:block lg:hidden">
                <LogoMark />
              </span>
            </>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={t("dashboard.collapse")}
            className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-black/4 hover:text-heading lg:inline-flex dark:hover:bg-white/6"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 cursor-pointer text-heading md:hidden"
          aria-label={t("dashboard.closeMenu")}
        >
          <X size={18} />
        </button>
      </div>

      {/* ---- Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ key, icon: Icon, href, children }) => {
          const active = href ? pathname === href : false;
          const expanded = openGroup === key;

          const rowClass = cn(
            "flex! w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition md:justify-center md:px-2 lg:px-3",
            collapsed ? "lg:justify-center" : "lg:justify-start",
            active
              ? "bg-primary text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.35)] hover:text-white"
              : "text-heading/75 hover:bg-black/4 hover:text-heading dark:hover:bg-white/6",
          );

          const inner = (
            <>
              <Icon size={18} className="shrink-0" />
              {label(t(`dashboard.nav.${key}`))}
              {children &&
                label(
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform", expanded && "rotate-180")}
                  />,
                )}
            </>
          );

          return (
            <div key={key}>
              {href ? (
                <Link href={href} className={rowClass}>
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={children ? () => setOpenGroup(expanded ? null : key) : undefined}
                  aria-expanded={children ? expanded : undefined}
                  className={rowClass}
                >
                  {inner}
                </button>
              )}

              {/* Sub-items disappear with the labels — a 56px rail has no room
                  for an indented text list. */}
              {children && expanded && !collapsed && (
                <div className="mt-1 space-y-0.5 md:hidden lg:block">
                  {children.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      className="block w-full cursor-pointer rounded-lg py-2 pr-3 pl-11.5 text-left text-[13.5px] font-medium text-muted transition hover:text-heading"
                    >
                      {t(`dashboard.nav.${sub}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ---- Upgrade card. Gone in every icon-only state — it is all text. */}
      {!collapsed && (
        <div className="px-3 pb-2 md:hidden lg:block">
          <div
            className="rounded-2xl border border-border p-4"
            style={{
              background:
                "linear-gradient(150deg, rgb(var(--primary__color) / 0.08) 0%, transparent 55%)",
            }}
          >
            <span className="flex! h-9 w-9 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
              <Sparkles size={17} />
            </span>
            <p className="mt-3 text-[12.5px]! leading-normal! text-muted">
              {t("dashboard.upgradeText")}
            </p>
            <button
              type="button"
              className="mt-3 cursor-pointer rounded-lg bg-heading px-3.5 py-2 text-[12px] font-semibold text-bg transition hover:opacity-90"
            >
              {t("dashboard.upgradeCta")}
            </button>
          </div>
        </div>
      )}

      {/* ---- Theme row: label + switch full-width, icon-only in the rail. */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme === "light"}
          aria-label={t("dashboard.lightMode")}
          className={cn(
            "flex! w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-heading/75 transition hover:text-heading md:justify-center md:px-2 lg:px-3",
            collapsed ? "lg:justify-center" : "lg:justify-start",
          )}
        >
          <Sun size={18} className="shrink-0" />
          {label(t("dashboard.lightMode"))}
          {!collapsed && (
            <span
              aria-hidden
              className={cn(
                "ml-auto hidden h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors md:hidden lg:block",
                theme === "light" ? "bg-primary" : "bg-black/15 dark:bg-white/20",
              )}
            >
              <span
                className={cn(
                  "block! h-4 w-4 rounded-full bg-white shadow transition-transform",
                  theme === "light" && "translate-x-4",
                )}
              />
            </span>
          )}
        </button>

        {/* Re-expand affordance — the header chevron leaves with the labels. */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={t("dashboard.expand")}
            className="mt-1 hidden w-full cursor-pointer items-center justify-center rounded-xl py-2.5 text-muted transition hover:bg-black/4 hover:text-heading lg:flex dark:hover:bg-white/6"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
