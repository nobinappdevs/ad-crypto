"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  HandCoins,
  IdCard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  ShoppingCart,
  Sun,
  UserCog,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { TOKEN_KEY } from "@/lib/axios";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { DEMO_USER, NOTIFICATIONS, type NotificationKind } from "@/config/account";

/**
 * The dashboard's top bar: which page you are on, on the left; everything about
 * the account, on the right.
 *
 * Sticky, because the page below it scrolls for a long way — a transaction table
 * or a KYC form leaves the header off-screen otherwise, and with it the way back
 * to any other section on a phone.
 *
 * Longest prefix wins, so a future `/dashboard/buy-crypto/xyz` still titles itself
 * "Buy Crypto" rather than falling back to the overview.
 */
const TITLES: { prefix: string; key: string }[] = [
  { prefix: "/dashboard/buy-crypto", key: "dashboard.nav.buyCrypto" },
  { prefix: "/dashboard/sell-crypto", key: "dashboard.nav.sellCrypto" },
  { prefix: "/dashboard/withdraw-crypto", key: "dashboard.nav.withdrawCrypto" },
  { prefix: "/dashboard/exchange-crypto", key: "dashboard.nav.exchangeCrypto" },
  { prefix: "/dashboard/my-cards", key: "dashboard.nav.myCards" },
  { prefix: "/dashboard/transactions", key: "dashboard.nav.transactions" },
  { prefix: "/dashboard/wallet", key: "walletDetails.navTitle" },
  { prefix: "/dashboard/security", key: "dashboard.account.security" },
  { prefix: "/dashboard/kyc", key: "dashboard.account.kyc" },
  { prefix: "/dashboard", key: "dashboard.title" },
];

/** Account rows in the profile menu. Profile has no `href` yet — that one comes later. */
const ACCOUNT_LINKS = [
  { key: "profile", icon: UserCog },
  { key: "security", icon: ShieldCheck, href: "/dashboard/security" },
  // An ID document, not a payment card — `CreditCard` here read as a billing row.
  { key: "kyc", icon: IdCard, href: "/dashboard/kyc" },
] as const;

const ACCOUNT_ROW_CLASS =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-heading/80 transition hover:bg-black/4 hover:text-heading dark:hover:bg-white/5";

const NOTIF_META: Record<
  NotificationKind,
  { icon: typeof Bell; tone: string; href: string }
> = {
  buy: { icon: ShoppingCart, tone: "bg-primary/10 text-primary", href: "/dashboard/buy-crypto" },
  sell: {
    icon: HandCoins,
    tone: "bg-hero-mint/12 text-hero-mint",
    href: "/dashboard/sell-crypto",
  },
  withdraw: {
    icon: ArrowDownToLine,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    href: "/dashboard/withdraw-crypto",
  },
  exchange: {
    icon: ArrowLeftRight,
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    href: "/dashboard/exchange-crypto",
  },
  card: { icon: WalletCards, tone: "bg-primary/10 text-primary", href: "/dashboard/my-cards" },
};

/**
 * "2 hours ago", in the active language, from an age in minutes.
 *
 * `Intl` rather than stored strings: a feed carries a dozen of these, and none of
 * them would survive a language switch as literal copy.
 */
function timeAgo(minutes: number, locale: string) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (minutes < 1440) return rtf.format(-Math.round(minutes / 60), "hour");
  return rtf.format(-Math.round(minutes / 1440), "day");
}

/** The bordered square icon button the header's controls are all built from. */
function NavBtn({
  label,
  onClick,
  badge,
  children,
}: {
  label: string;
  onClick?: () => void;
  badge?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-border bg-card text-muted transition hover:border-primary hover:text-heading"
    >
      {children}
      {badge && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-card bg-hero-neg"
        />
      )}
    </button>
  );
}

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const { t, lang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const k = (name: string) => t(`dashboard.${name}`);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const title = TITLES.find((entry) => pathname.startsWith(entry.prefix))?.key ?? "dashboard.title";
  const unseen = NOTIFICATIONS.filter((n) => !n.seen).length;

  // One listener for both panels: whichever the pointer landed outside of closes.
  useEffect(() => {
    if (!menuOpen && !notifOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setNotifOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, notifOpen]);

  function handleLogout() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    toast.success(k("logout"));
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:gap-4 sm:px-6">
      {/* ---- Left: where you are */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label={k("openMenu")}
          className="shrink-0 cursor-pointer text-heading md:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-[17px]! leading-tight! font-bold! tracking-[-0.01em] sm:text-[19px]!">
            {t(title)}
          </h1>
          {/* Hidden on a phone: at 360px the title and four controls already fill
              the row, and a second line pushes the bar past 64px. */}
          <p className="hidden truncate text-[12px]! text-muted md:block">{k("navbar.subtitle")}</p>
        </div>
      </div>

      {/* ---- Right: the account */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher />

        {/* The theme control lives here rather than in the rail: it is a property of
            the session, like the language beside it, not a destination. */}
        <NavBtn
          label={t(theme === "dark" ? "theme.toggleToLight" : "theme.toggleToDark")}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </NavBtn>

        {/* ---- Notifications */}
        <div ref={notifRef} className="relative">
          <NavBtn
            label={k("notifications")}
            badge={unseen > 0}
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
          >
            <Bell size={16} />
          </NavBtn>

          {notifOpen && (
            <div className="absolute end-0 top-full z-50 mt-2 w-88 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="text-[13.5px]! font-bold!">{k("notificationsPanel.title")}</p>
                {unseen > 0 ? (
                  <span className="inline-flex! items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11.5px]! font-semibold! text-primary">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {k("notificationsPanel.newCount").replace("{n}", String(unseen))}
                  </span>
                ) : (
                  <span className="text-[11.5px]! text-muted">{NOTIFICATIONS.length}</span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {NOTIFICATIONS.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <span
                      aria-hidden
                      className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
                    >
                      <Bell size={20} />
                    </span>
                    <p className="mt-3 text-[13px]! font-semibold!">
                      {k("notificationsPanel.empty")}
                    </p>
                    <p className="mt-1 text-[12px]! text-muted">
                      {k("notificationsPanel.emptyDesc")}
                    </p>
                  </div>
                ) : (
                  NOTIFICATIONS.map((notification) => {
                    const { icon: Icon, tone, href } = NOTIF_META[notification.kind];
                    const base = `notificationsPanel.items.${notification.key}`;
                    return (
                      <Link
                        key={notification.id}
                        href={href}
                        onClick={() => setNotifOpen(false)}
                        className={cn(
                          "group relative flex! gap-3 border-b border-border px-4 py-3 transition last:border-b-0 hover:bg-black/4 dark:hover:bg-white/5",
                          !notification.seen && "bg-primary/4",
                        )}
                      >
                        {!notification.seen && (
                          <span aria-hidden className="absolute inset-y-0 start-0 w-0.5 bg-primary" />
                        )}
                        <span
                          aria-hidden
                          className={cn(
                            "grid! h-9 w-9 shrink-0 place-items-center rounded-xl transition group-hover:scale-105",
                            tone,
                          )}
                        >
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-[13px]!",
                                notification.seen ? "font-semibold! text-muted" : "font-bold!",
                              )}
                            >
                              {k(`${base}.title`)}
                            </span>
                            <span className="shrink-0 text-[11px]! whitespace-nowrap text-muted">
                              {timeAgo(notification.minutesAgo, lang)}
                            </span>
                          </span>
                          {/* No `block` alongside `line-clamp-2`: the clamp needs
                              `display:-webkit-box`, and a competing display
                              utility is a coin toss over which one wins. */}
                          <span className="mt-0.5 line-clamp-2 text-[11.5px]! leading-relaxed! text-muted">
                            {k(`${base}.body`)}
                          </span>
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>

              <Link
                href="/dashboard/transactions"
                onClick={() => setNotifOpen(false)}
                className="block! border-t border-border px-4 py-3 text-center text-[12.5px] font-semibold text-primary transition hover:bg-primary/5"
              >
                {k("notificationsPanel.viewAll")}
              </Link>
            </div>
          )}
        </div>

        {/* ---- Account */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-expanded={menuOpen}
            aria-label={k("accountMenu")}
            className="relative grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-primary/10 text-[12px] font-bold text-primary ring-2 ring-primary/20 transition hover:ring-primary/50"
          >
            <Image
              src={DEMO_USER.avatar}
              alt=""
              width={700}
              height={966}
              className="h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute end-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-hero-mint"
            />
          </button>

          {menuOpen && (
            <div className="absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Image
                  src={DEMO_USER.avatar}
                  alt=""
                  width={700}
                  height={966}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px]! font-bold!">{DEMO_USER.name}</p>
                  <p className="truncate text-[11.5px]! text-muted">{DEMO_USER.email}</p>
                </div>
              </div>

              <nav className="py-1">
                {ACCOUNT_LINKS.map((link) => {
                  const Icon = link.icon;
                  const row = (
                    <>
                      <Icon size={15} className="shrink-0 text-muted" aria-hidden />
                      {k(`account.${link.key}`)}
                    </>
                  );

                  // A section that does not exist yet stays a button: same row, no
                  // dead navigation.
                  return "href" in link ? (
                    <Link
                      key={link.key}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(ACCOUNT_ROW_CLASS, "flex!")}
                    >
                      {row}
                    </Link>
                  ) : (
                    <button key={link.key} type="button" className={ACCOUNT_ROW_CLASS}>
                      {row}
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-border py-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-muted transition hover:bg-hero-neg/8 hover:text-hero-neg"
                >
                  <LogOut size={15} aria-hidden />
                  {k("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portalled to <body>: inside the sticky header it would be trapped in that
          stacking context and land under the rail. */}
      {confirmLogout &&
        createPortal(
          <div
            className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-card"
            >
              <span
                aria-hidden
                className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
              >
                <LogOut size={20} />
              </span>
              <h2 className="mt-4 text-[17px]! font-bold!">{k("logoutTitle")}</h2>
              <p className="mt-1.5 text-[13px]! leading-relaxed! text-muted">{k("logoutDesc")}</p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-heading transition hover:bg-black/4 dark:hover:bg-white/5"
                >
                  {k("cancel")}
                </button>
                <Button variant="danger" size="md" fullWidth onClick={handleLogout} className="flex-1">
                  {k("confirmLogout")}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
