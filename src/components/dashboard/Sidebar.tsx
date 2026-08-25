"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight,
  HandCoins,
  Headphones,
  LayoutGrid,
  LogOut,
  ReceiptText,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Logo, LogoMark } from "@/components/share/Logo";
import { LogoutDialog } from "./LogoutDialog";

type NavItem = {
  key: string;
  icon: ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;
  href?: string;
  /** Where the label lives under `dashboard.`, when it is not `nav.<key>`. */
  labelKey?: string;
};

const MENU: { titleKey?: string; items: NavItem[] }[] = [
  {
    items: [{ key: "dashboard", icon: LayoutGrid, href: "/dashboard" }],
  },
  {
    titleKey: "navGroups.trade",
    items: [
      { key: "buyCrypto", icon: ShoppingCart, href: "/dashboard/buy-crypto" },
      { key: "sellCrypto", icon: HandCoins, href: "/dashboard/sell-crypto" },
      { key: "exchangeCrypto", icon: ArrowLeftRight, href: "/dashboard/exchange-crypto" },
    ],
  },
  {
    titleKey: "navGroups.wallet",
    items: [
      { key: "wallets", icon: Wallet, href: "/dashboard/wallets", labelKey: "myWallets" },
      { key: "withdrawCrypto", icon: ArrowDownToLine, href: "/dashboard/withdraw-crypto" },
      // { key: "myCards", icon: WalletCards, href: "/dashboard/my-cards" },
    ],
  },
  {
    // The ledger, last and on its own — a record rather than an action.
    items: [{ key: "transactions", icon: ReceiptText, href: "/dashboard/transactions" }],
  },
];

/** Hover/focus reveal styles for the collapsed rail. */
const HOVER_COLLAPSED = {
  width: "md:hover:w-65 md:focus-within:w-65",
  shadow:
    "md:hover:shadow-[0_24px_60px_rgb(2_10_22/0.18)] md:focus-within:shadow-[0_24px_60px_rgb(2_10_22/0.18)]",
  show: "md:group-hover/rail:block md:group-focus-within/rail:block",
  hide: "md:group-hover/rail:hidden md:group-focus-within/rail:hidden",
  brandRow:
    "md:group-hover/rail:justify-between md:group-hover/rail:px-5 md:group-focus-within/rail:justify-between md:group-focus-within/rail:px-5",
  row: "md:group-hover/rail:mx-0 md:group-hover/rail:justify-start md:group-hover/rail:gap-3 md:group-hover/rail:rounded-none md:group-hover/rail:border-s-4 md:group-hover/rail:px-4 md:group-focus-within/rail:mx-0 md:group-focus-within/rail:justify-start md:group-focus-within/rail:gap-3 md:group-focus-within/rail:rounded-none md:group-focus-within/rail:border-s-4 md:group-focus-within/rail:px-4",
  plainRow:
    "md:group-hover/rail:justify-start md:group-hover/rail:px-4 md:group-focus-within/rail:justify-start md:group-focus-within/rail:px-4",
  activeRow:
    "md:group-hover/rail:border-primary md:group-hover/rail:bg-transparent md:group-focus-within/rail:border-primary md:group-focus-within/rail:bg-transparent",
};

/** The same reveal, but only below `lg` — above it the rail is already open. */
const HOVER_EXPANDABLE = {
  width: "md:max-lg:hover:w-65 md:max-lg:focus-within:w-65",
  shadow:
    "md:max-lg:hover:shadow-[0_24px_60px_rgb(2_10_22/0.18)] md:max-lg:focus-within:shadow-[0_24px_60px_rgb(2_10_22/0.18)]",
  show: "md:max-lg:group-hover/rail:block md:max-lg:group-focus-within/rail:block",
  hide: "md:max-lg:group-hover/rail:hidden md:max-lg:group-focus-within/rail:hidden",
  brandRow:
    "md:max-lg:group-hover/rail:justify-between md:max-lg:group-hover/rail:px-5 md:max-lg:group-focus-within/rail:justify-between md:max-lg:group-focus-within/rail:px-5",
  row: "md:max-lg:group-hover/rail:mx-0 md:max-lg:group-hover/rail:justify-start md:max-lg:group-hover/rail:gap-3 md:max-lg:group-hover/rail:rounded-none md:max-lg:group-hover/rail:border-s-4 md:max-lg:group-hover/rail:px-4 md:max-lg:group-focus-within/rail:mx-0 md:max-lg:group-focus-within/rail:justify-start md:max-lg:group-focus-within/rail:gap-3 md:max-lg:group-focus-within/rail:rounded-none md:max-lg:group-focus-within/rail:border-s-4 md:max-lg:group-focus-within/rail:px-4",
  plainRow:
    "md:max-lg:group-hover/rail:justify-start md:max-lg:group-hover/rail:px-4 md:max-lg:group-focus-within/rail:justify-start md:max-lg:group-focus-within/rail:px-4",
  activeRow:
    "md:max-lg:group-hover/rail:border-primary md:max-lg:group-hover/rail:bg-transparent md:max-lg:group-focus-within/rail:border-primary md:max-lg:group-focus-within/rail:bg-transparent",
};

/** `/dashboard` has to match exactly or it lights up on every child route. */
const isActive = (pathname: string, href?: string) =>
  !href ? false : href === "/dashboard" ? pathname === href : pathname.startsWith(href);

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
  const pathname = usePathname() ?? "";
  const k = (name: string) => t(`dashboard.${name}`);

  const [logoutOpen, setLogoutOpen] = useState(false);

  /** Collapsed drops the `lg:` overrides, so the `md:` rail styles apply there too. */
  const lg = (classes: string) => (collapsed ? "" : classes);

  const hover = collapsed ? HOVER_COLLAPSED : HOVER_EXPANDABLE;

  return (
    <aside
      className={cn(
        "group/rail fixed inset-y-0 left-0 z-50 flex h-screen w-65 flex-col overflow-hidden border-r border-border bg-card transition-[transform,width,box-shadow] duration-300",
        "md:sticky md:top-0 md:z-40 md:w-14 md:translate-x-0",
        lg("lg:w-65"),
        hover.width,
        hover.shadow,
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      {/* Brand light along the top edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-primary/6 to-transparent"
      />

      {/* ---- Brand row */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-5 md:justify-center md:px-0",
          lg("lg:justify-between lg:px-5"),
          hover.brandRow,
        )}
      >
        <Link
          href="/"
          aria-label={k("sidebar.goHome")}
          onClick={onClose}
          // `shrink-0` so the width animation clips the wordmark instead of squashing it.
          className="inline-flex! shrink-0 items-center overflow-hidden"
        >
          <span className={cn("block md:hidden", lg("lg:block"), hover.show)}>
            {/* One size at every breakpoint: the rail is 260px wide throughout,
                so the wordmark has no reason to grow with the window. */}
            <Logo className="max-w-24 lg:max-w-24 xl:max-w-24" />
          </span>
          <span className={cn("hidden md:block", lg("lg:hidden"), hover.hide)}>
            {/* Tiled, so the mark has the same footprint as the icons below. */}
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/8">
              <LogoMark height={26} />
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label={k("closeMenu")}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-heading md:hidden dark:hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>

      {/* ---- Nav */}
      <nav className="relative flex h-full flex-col overflow-x-hidden overflow-y-auto py-2">
        {MENU.map((section, si) => (
          <div key={section.titleKey ?? si} className="mb-1 flex flex-col">
            {section.titleKey && (
              <span
                className={cn(
                  "block px-5 pt-4 pb-1.5 text-[11px]! font-bold! tracking-[1.4px] text-muted/70 uppercase md:hidden",
                  lg("lg:block"),
                  hover.show,
                )}
              >
                {k(section.titleKey)}
              </span>
            )}

            {section.items.map(({ key, icon: Icon, href, labelKey }) => {
              const active = isActive(pathname, href);

              const row = (
                <>
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} className="shrink-0" />

                  <span
                    className={cn(
                      "block truncate text-[14px] font-medium md:hidden",
                      lg("lg:block"),
                      hover.show,
                      active && "text-primary",
                    )}
                  >
                    {k(labelKey ?? `nav.${key}`)}
                  </span>
                </>
              );

              const rowClass = cn(
                "relative my-0.5 flex items-center gap-3 border-s-4 px-4 py-2.5 transition-colors",
                "md:mx-2 md:justify-center md:gap-0 md:rounded-xl md:border-s-0 md:px-0",
                lg("lg:mx-0 lg:justify-start lg:gap-3 lg:rounded-none lg:border-s-4 lg:px-4"),
                hover.row,
                active
                  ? cn(
                      "border-primary text-primary md:border-transparent md:bg-primary/10",
                      lg("lg:border-primary lg:bg-transparent"),
                      hover.activeRow,
                    )
                  : "border-transparent text-heading/70 hover:text-heading",
              );

              // Collapsed, the label is `display:none`, so the row would have no
              // accessible name and no tooltip — the title carries both.
              const label = k(labelKey ?? `nav.${key}`);

              return href ? (
                <Link
                  key={key}
                  href={href}
                  onClick={onClose}
                  title={label}
                  className={cn(rowClass, "flex!")}
                >
                  {row}
                </Link>
              ) : (
                // No route yet: same row, no dead navigation.
                <button
                  key={key}
                  type="button"
                  title={label}
                  className={cn(rowClass, "w-full cursor-pointer")}
                >
                  {row}
                </button>
              );
            })}
          </div>
        ))}

        {/* ---- Support and the way out, pinned to the bottom */}
        <div className="mt-auto pt-2">
          {/* Rail version: the card is all text, so it becomes its own icon. */}
          <div
            className={cn(
              "hidden px-2 pb-2 md:flex md:justify-center",
              lg("lg:hidden"),
              hover.hide,
            )}
          >
            <Link
              href="/contact"
              aria-label={k("sidebar.helpBtn")}
              title={k("sidebar.helpBtn")}
              className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
            >
              <Headphones size={17} />
            </Link>
          </div>

          {/* Signing out belongs where the account rows are, not only behind the
              avatar menu — the same dialog either way, so it is asked the same. */}
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            title={k("logout")}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-hero-neg/80 transition-colors hover:bg-hero-neg/8 hover:text-hero-neg md:justify-center md:px-0",
              lg("lg:justify-start lg:px-4"),
              hover.plainRow,
            )}
          >
            <LogOut size={18} aria-hidden className="shrink-0 rtl:rotate-180" />
            <span
              className={cn("block text-[14px] font-medium md:hidden", lg("lg:block"), hover.show)}
            >
              {k("logout")}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={k(collapsed ? "expand" : "collapse")}
            aria-pressed={collapsed}
            className={cn(
              "hidden w-full cursor-pointer items-center gap-3 border-t border-border px-4 py-3.5 text-muted transition-colors hover:bg-primary/8 hover:text-primary md:flex md:justify-center md:px-0",
              lg("lg:justify-start lg:px-4"),
              hover.plainRow,
            )}
          >
            {collapsed ? (
              <ChevronsRight size={18} aria-hidden className="shrink-0 rtl:rotate-180" />
            ) : (
              <ChevronsLeft size={18} aria-hidden className="shrink-0 rtl:rotate-180" />
            )}
            <span className={cn("hidden text-[13px] font-medium", lg("lg:block"), hover.show)}>
              {k(collapsed ? "expand" : "collapse")}
            </span>
          </button>
        </div>
      </nav>

      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </aside>
  );
}
