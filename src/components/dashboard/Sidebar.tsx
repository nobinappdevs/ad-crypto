"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ChevronsLeft,
  ChevronsRight,
  HandCoins,
  Headphones,
  LayoutGrid,
  ReceiptText,
  ShoppingCart,
  WalletCards,
  X,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Logo, LogoMark } from "@/components/share/Logo";

/**
 * The rail, in three states: a drawer below `md`, a 56px icon rail from `md`, and
 * a 260px list from `lg` — which the collapse toggle folds back to the rail.
 *
 * Rows are grouped under section labels rather than run as one flat list: seven
 * destinations read as seven unrelated choices, four of which are the same verb on
 * a different balance.
 *
 * The active row is marked by a left rule and the brand colour, NOT a filled pill.
 * In the rail there is no room for a rule, so it becomes a tinted tile instead.
 *
 * ── Hover-expand ──
 * Pointing at the narrow rail opens it to its full width for as long as the pointer
 * is on it, and it folds straight back when the pointer leaves. That replaces the
 * per-row tooltips this file used to carry: a tooltip names one icon at a time,
 * where the expansion names all seven at once, shows the section headings that give
 * them meaning, and lets you read the list without committing to unfolding it.
 *
 * It expands as an OVERLAY, not by widening its grid column: the column stays 56px,
 * so the page behind it never reflows. A sidebar that shoves the whole dashboard
 * sideways every time the pointer crosses it is worse than no labels at all.
 *
 * Which widths count as "narrow" depends on the collapse state — from `md` up when
 * collapsed, only between `md` and `lg` otherwise — so the hover variants are
 * spelled out per case in `HOVER` below rather than composed at runtime. Tailwind
 * only generates classes it can see written out in the source.
 */
type NavItem = {
  key: string;
  icon: ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>;
  href?: string;
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
      { key: "withdrawCrypto", icon: ArrowDownToLine, href: "/dashboard/withdraw-crypto" },
      { key: "myCards", icon: WalletCards, href: "/dashboard/my-cards" },
    ],
  },
  {
    // Last, and on its own: the ledger is where you go AFTER doing something, so it
    // reads as the record of the groups above rather than one more action.
    items: [{ key: "transactions", icon: ReceiptText, href: "/dashboard/transactions" }],
  },
];

/**
 * What hovering the rail turns on, per collapse state.
 *
 * `group-hover/rail` is a NAMED group on purpose: an unnamed `group` on the aside
 * would also satisfy every `group-hover` inside it, so any descendant hover style
 * would fire from anywhere in the sidebar.
 *
 * `focus-within` rides along with each one, so tabbing into the rail reveals the
 * same thing pointing at it does — otherwise a keyboard user gets seven unlabelled
 * icons and no way to see what they are.
 *
 * `width` and `shadow` are the exception: they style the ASIDE, which is the group
 * itself, and `group-hover` compiles to `:where(.group):hover *` — descendants only.
 * The element being hovered needs plain `hover:` / `focus-within:`. Getting this
 * wrong is not a no-op, it is the worst of both: every label unfolds inside a rail
 * that is still 56px wide.
 */
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

  /**
   * Collapsing DROPS the `lg:` overrides so the `md:` rail styles apply at large
   * widths too. Every row therefore needs one expression rather than two variants.
   */
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
      {/* Brand light, so the rail's top edge is not a flat block of card colour. */}
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
        {/* The brand row is brand only — the collapse control lives at the bottom
            edge, where there is room for it in the rail too. */}
        <Link
          href="/"
          aria-label={k("sidebar.goHome")}
          onClick={onClose}
          // `shrink-0` so the 300ms width animation CLIPS the row's contents at the
          // rail's edge instead of squashing a 120px wordmark into 16px on the way.
          className="inline-flex! shrink-0 items-center overflow-hidden"
        >
          <span className={cn("block md:hidden", lg("lg:block"), hover.show)}>
            <Logo className="max-w-30 lg:max-w-30 xl:max-w-30" />
          </span>
          <span className={cn("hidden md:block", lg("lg:hidden"), hover.hide)}>
            {/* Tile rather than a bare 25px crop: at 56px the glyph on its own reads
                as a stray graphic, and the tile gives it the same footprint as the
                icons below it. */}
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

            {section.items.map(({ key, icon: Icon, href }) => {
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
                    {k(`nav.${key}`)}
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

              return href ? (
                <Link key={key} href={href} onClick={onClose} className={cn(rowClass, "flex!")}>
                  {row}
                </Link>
              ) : (
                // A section that does not exist yet: same row, no dead navigation.
                <button key={key} type="button" className={cn(rowClass, "w-full cursor-pointer")}>
                  {row}
                </button>
              );
            })}
          </div>
        ))}

        {/* ---- Support, pinned to the bottom */}
        <div className="mt-auto">
          {/* Rail version: the card is all text, so it becomes its own icon. */}
          <div
            className={cn(
              "hidden px-2 pb-4 md:flex md:justify-center",
              lg("lg:hidden"),
              hover.hide,
            )}
          >
            <Link
              href="/contact"
              aria-label={k("sidebar.helpBtn")}
              className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
            >
              <Headphones size={17} />
            </Link>
          </div>

          <div className={cn("px-3 pb-4 md:hidden", lg("lg:block"), hover.show)}>
            <div
              className="relative overflow-hidden rounded-2xl border border-border p-4"
              style={{
                background:
                  "linear-gradient(150deg, rgb(var(--primary__color) / 0.14) 0%, transparent 60%)",
              }}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hero-mint opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-hero-mint" />
                </span>
                <span className="text-[10px]! font-bold! tracking-widest text-muted uppercase">
                  {k("sidebar.liveSupport")}
                </span>
              </div>

              <p className="mt-2.5 text-[14px]! leading-tight! font-bold! text-heading">
                {k("sidebar.helpTitle")}
              </p>
              <p className="mt-1 text-[11.5px]! leading-relaxed! text-muted">
                {k("sidebar.helpSub")}
              </p>

              <Link
                href="/contact"
                className="btn-lift mt-3 flex! w-full items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-[12px] font-semibold text-white!"
              >
                <Headphones size={13} strokeWidth={2.5} aria-hidden />
                {k("sidebar.helpBtn")}
              </Link>
            </div>
          </div>

          {/* ---- Collapse control, on the bottom edge in every state
                  It used to sit in the brand row, where a 56px rail has no room for
                  it beside the logo — so it only appeared on hover, and a control you
                  have to discover by hovering is one most people never find. Down
                  here the rail has a full row to spare, so the button is visible
                  whether the sidebar is folded, unfolded or peeking open, and it
                  never competes with the logo for the same 56px. */}
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
    </aside>
  );
}
