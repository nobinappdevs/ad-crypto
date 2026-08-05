"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { useLogout, useProfile } from "@/hooks/useAuth";
import { useUpdateProfileType } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { useRole } from "@/components/context/RoleContext";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";
import { UserCog, ShieldCheck, CreditCard, LogOut, ArrowLeftRight, Wallet, ArrowUpRight, Menu, Sun, Moon, Bell } from "lucide-react";

const TITLE_KEYS = {
  "/dashboard":              "dashboard.sidebar.overview",
  "/dashboard/escrow":               "dashboard.sidebar.escrow",
  "/dashboard/escrow/conversation":  "dashboard.sidebar.escrow",
  "/dashboard/create-escrow":        "dashboard.home.createEscrow",
  "/dashboard/transactions":  "dashboard.sidebar.transactions",
  "/dashboard/add-money":    "dashboard.sidebar.addMoney",
  "/dashboard/money-out":    "dashboard.sidebar.moneyOut",
  "/dashboard/exchange":     "dashboard.sidebar.exchange",
  "/dashboard/security":     "dashboard.sidebar.security",
  "/dashboard/kyc":          "dashboard.sidebar.kyc",
  "/dashboard/profile":      "dashboard.sidebar.profile",
};

const PROFILE_LINK_DEFS = [
  { labelKey: "dashboard.sidebar.profile",  href: "/dashboard/profile",  Icon: UserCog    },
  { labelKey: "dashboard.sidebar.security", href: "/dashboard/security", Icon: ShieldCheck },
  { labelKey: "dashboard.sidebar.kyc",      href: "/dashboard/kyc",      Icon: CreditCard  },
];

/* ── notification type → icon + tint + destination ── */
function notifMeta(type: string) {
  const s = (type ?? "").toUpperCase();
  if (s.includes("EXCHANGE")) return { Icon: ArrowLeftRight, tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", href: "/dashboard/exchange" };
  if (s.includes("WITHDRAW") || s.includes("OUT")) return { Icon: ArrowUpRight, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", href: "/dashboard/money-out" };
  if (s.includes("BALANCE") || s.includes("ADD")) return { Icon: Wallet, tone: "bg-primary/10 text-primary", href: "/dashboard/add-money" };
  return { Icon: Wallet, tone: "bg-primary/10 text-primary", href: "/dashboard/transactions" };
}

/* ── icon btn ── */
function NavBtn({ label, children, onClick, badge, badgeCount }: {
  label: string; children: React.ReactNode; onClick?: () => void; badge?: boolean; badgeCount?: number;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className="cursor-pointer relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted transition hover:border-border/80 hover:text-heading [&>svg]:size-4.25">
      {children}
      {!!badgeCount && (
        <span aria-hidden className="absolute -right-1 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-card bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
      {badge && !badgeCount && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-card bg-red-500" />}
    </button>
  );
}

/* ── notification skeleton row ── */
function NotifSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-border" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-border" />
        <div className="h-2.5 w-full animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}

/* ── component ── */
export function Navbar({ onMenu = () => {} }: { onMenu?: () => void }) {
  const { role, setRole }      = useRole();
  const [dropOpen, setDrop]    = useState(false);
  const [notifOpen, setNotif]  = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { theme, toggleTheme}  = useTheme();
  const { t }                  = useLang();
  const logout                 = useLogout();
  const { data: profileRes }   = useProfile();
  const { data: notifRes, isLoading: notifLoading } = useNotifications();
  const updateType             = useUpdateProfileType();

  const notifications: any[] = (notifRes as any)?.data?.notifications ?? [];
  const unseenCount = notifications.filter((n) => String(n.seen) === "0").length;
  const pathname               = usePathname();
  const dropRef                = useRef(null);
  const notifRef               = useRef(null);

  // Identity for the profile chip/menu. The active buyer/seller view comes from
  // RoleContext (seeded from the profile type; the toggle overrides it).
  const user = (profileRes as any)?.data?.user;

  // Real identity for the profile chip/menu.
  const fullName: string = user?.fullname || [user?.firstname, user?.lastname].filter(Boolean).join(" ") || "";
  const email: string = user?.email ?? "";
  const initials =
    fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("") || "U";
  // Use the profile image the API returns (default or uploaded); initials are the fallback.
  const avatarUrl: string | null = user?.userImage ?? null;

  // Toggle buyer/seller — optimistic, reverts if the API call fails.
  const switchRole = (next: string) => {
    if (next === role || updateType.isPending) return;
    const prev = role;
    setRole(next);
    updateType.mutate(undefined, { onError: () => setRole(prev) });
  };

  const title  = t(TITLE_KEYS[pathname] ?? "dashboard.sidebar.overview");
  const isDark = theme === "dark";

  const ROLE_OPTS = [
    { key: "buyer",  label: t("dashboard.navbar.buyer")  },
    { key: "seller", label: t("dashboard.navbar.seller") },
  ];

  /* close dropdowns on outside click / Escape */
  useEffect(() => {
    if (!dropOpen && !notifOpen) return;
    const onPointer = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDrop(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotif(false);
    };
    const onKey = (e) => { if (e.key === "Escape") { setDrop(false); setNotif(false); } };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown",   onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [dropOpen, notifOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:gap-4 sm:px-8">

      {/* ── left ── */}
      <div className="flex min-w-0 items-center gap-3">
        {/* mobile menu button — opens drawer */}
        <button
          type="button"
          onClick={onMenu}
          aria-label={t("dashboard.navbar.menu")}
          className="cursor-pointer shrink-0 place-items-center md:hidden"
        >
          <Menu size={24} strokeWidth={2} aria-hidden />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold leading-tight text-heading">{title}</h1>
          <p className="truncate text-xs md:block hidden text-muted">{t("dashboard.navbar.subtitle")}</p>
        </div>
      </div>

      {/* ── right ── */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

        {/* role switcher — below sm there's no room here, so it moves into the
            profile dropdown instead of disappearing entirely */}
        <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-surface p-1 sm:flex">
          {ROLE_OPTS.map(({ key: r, label }) => (
            <button key={r} type="button" onClick={() => switchRole(r)} disabled={updateType.isPending}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                role === r ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-muted hover:text-heading"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* language */}
        <LanguageSwitcher />

        {/* theme */}
        <NavBtn label={t("theme.toggle")} onClick={toggleTheme}>
          {isDark
            ? <Sun size={17} strokeWidth={2} aria-hidden />
            : <Moon size={17} strokeWidth={2} aria-hidden />
          }
        </NavBtn>

        {/* notifications dropdown */}
        <div ref={notifRef} className="relative">
          <NavBtn label={t("dashboard.navbar.notifications")} badge={unseenCount > 0}
            onClick={() => { setNotif(v => !v); setDrop(false); }}>
            <Bell size={17} strokeWidth={2} aria-hidden />
          </NavBtn>

          {notifOpen && (
            <div className="absolute inset-e-0 top-full z-50 mt-2 w-88 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/30">

              {/* header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <p className="text-sm font-bold text-heading">{t("dashboard.navbar.notifications")}</p>
                {unseenCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    <i className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                    {t("dashboard.navbar.newCount").replace("{n}", String(unseenCount))}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted">{notifications.length}</span>
                )}
              </div>

              {/* list */}
              <div className="scrollbar-thin max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                {notifLoading ? (
                  <>
                    <NotifSkeleton /><NotifSkeleton /><NotifSkeleton />
                  </>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <Bell size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.navbar.noNotifications")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.navbar.noNotificationsDesc")}</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const { Icon, tone, href } = notifMeta(n.type);
                    const unseen = String(n.seen) === "0";
                    return (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => setNotif(false)}
                        className={`group relative flex gap-3 border-b border-border px-4 py-3.5 transition last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 ${unseen ? "bg-primary/3" : ""}`}
                      >
                        {unseen && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105 ${tone}`}>
                          <Icon size={16} strokeWidth={2} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={`truncate text-sm ${unseen ? "font-bold text-heading" : "font-semibold text-body"}`}>{n.message?.title}</p>
                            <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-muted">{n.message?.time}</span>
                          </div>
                          <p className={`mt-0.5 line-clamp-2 text-xs leading-relaxed ${unseen ? "text-muted" : "text-muted/70"}`}>{n.message?.message}</p>
                        </div>
                        {unseen && <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </Link>
                    );
                  })
                )}
              </div>

              {/* footer */}
              <Link href="/dashboard/transactions" onClick={() => setNotif(false)}
                className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/5">
                {t("dashboard.navbar.viewAll")}
              </Link>
            </div>
          )}
        </div>

        {/* profile dropdown */}
        <div ref={dropRef} className="relative">
          <button type="button" onClick={() => { setDrop(v => !v); setNotif(false); }} aria-label={t("dashboard.navbar.profileMenu")}
            aria-expanded={dropOpen}
            className="cursor-pointer relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/20 transition hover:ring-primary/50">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote avatar in a static-export app
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
            <span aria-hidden className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary shadow-[0_0_5px_var(--color-primary)]" />
          </button>

          {/* panel */}
          {dropOpen && (
            <div className="absolute inset-e-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/30">

              {/* user row */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote avatar in a static-export app
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-heading">{fullName || "—"}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
              </div>

              {/* role switcher — only here below sm, where the header has no room */}
              <div className="border-b border-border px-4 py-3 sm:hidden">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                  {t("dashboard.navbar.viewingAs")}
                </p>
                <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1">
                  {ROLE_OPTS.map(({ key: r, label }) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => switchRole(r)}
                      disabled={updateType.isPending}
                      className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                        role === r ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-muted hover:text-heading"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* links */}
              <nav className="py-1">
                {PROFILE_LINK_DEFS.map(({ labelKey, href, Icon }) => (
                  <Link key={href} href={href} onClick={() => setDrop(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5 ${
                      pathname === href ? "text-primary" : "text-body hover:text-heading"
                    }`}>
                    <Icon size={15} strokeWidth={2} aria-hidden
                      className={pathname === href ? "text-primary" : "shrink-0 text-muted"} />
                    {t(labelKey)}
                  </Link>
                ))}
              </nav>

              {/* logout */}
              <div className="border-t border-border py-1">
                <button
                  type="button"
                  onClick={() => { setDrop(false); setConfirmLogout(true); }}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-red-500/5 hover:text-red-500"
                >
                  <LogOut size={15} strokeWidth={2} aria-hidden />
                  {t("dashboard.navbar.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout confirmation modal — portalled to <body> so it escapes the
          sticky header's stacking context and overlays the sidebar too. */}
      {confirmLogout && createPortal(
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { if (!logout.isPending) setConfirmLogout(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
              <LogOut size={22} strokeWidth={2} aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-bold text-heading">{t("dashboard.navbar.logoutTitle")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("dashboard.navbar.logoutDesc")}</p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                disabled={logout.isPending}
                className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
              >
                {t("dashboard.navbar.cancel")}
              </button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                loading={logout.isPending}
                onClick={() => logout.mutate()}
                className="flex-1"
              >
                {t("dashboard.navbar.confirmLogout")}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
