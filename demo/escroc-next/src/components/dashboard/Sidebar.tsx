"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import {
  LayoutDashboard,
  ShieldCheck,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Headphones,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";

function isActive(pathname, href) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function Sidebar({
  open = false,
  collapsed = false,
  onClose = () => {},
  onToggleCollapse = () => {},
}: {
  open?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLang();

  /* When collapsed, we drop the `lg:` overrides so the `md:` rail styles
     take effect on large screens too — turning the full sidebar into a rail. */
  const lg = (cls: string) => (collapsed ? "" : cls);

  const MENU = [
    {
      titleKey: "",
      items: [
        { labelKey: "dashboard.sidebar.overview",     href: "/dashboard",              Icon: LayoutDashboard },
        { labelKey: "dashboard.sidebar.escrow",       href: "/dashboard/escrow",       Icon: ShieldCheck     },
        { labelKey: "dashboard.sidebar.transactions", href: "/dashboard/transactions", Icon: Receipt         },
      ],
    },
    {
      titleKey: "dashboard.sidebar.finance",
      items: [
        { labelKey: "dashboard.sidebar.addMoney",  href: "/dashboard/add-money",  Icon: ArrowDownToLine },
        { labelKey: "dashboard.sidebar.moneyOut",  href: "/dashboard/money-out",  Icon: ArrowUpFromLine },
        { labelKey: "dashboard.sidebar.exchange",  href: "/dashboard/exchange",   Icon: ArrowLeftRight  },
      ],
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-65 flex-col overflow-hidden border-r border-border bg-card transition-[transform,width] duration-300
        md:sticky md:top-0 md:z-40 md:w-14 md:translate-x-0
        ${lg("lg:w-65")}
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >

      {/* Decorative glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-primary/6 to-transparent" />

      {/* Brand */}
      <div className={`flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-6 md:justify-center md:px-0 ${lg("lg:justify-between lg:px-6")}`}>
        <Link href="/" aria-label={t("dashboard.sidebar.goHome")} onClick={onClose} className={collapsed ? "lg:hidden" : ""}>
          <Image
            src="/assets/navbar/logo.webp"
            alt="Escroc"
            width={120}
            height={40}
            className={`block h-auto w-28 object-contain md:hidden ${lg("lg:block")}`}
            priority
          />
          <span className={`hidden h-8 w-8 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary md:grid ${lg("lg:hidden")}`}>
            E
          </span>
        </Link>

        {/* Collapse toggle — icon only, large screens, beside the logo */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={t("dashboard.sidebar.collapse")}
          className="cursor-pointer hidden h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-primary/10 hover:text-primary lg:grid"
        >
          {collapsed ? (
            <ChevronsRight size={20} strokeWidth={2} aria-hidden />
          ) : (
            <ChevronsLeft size={20} strokeWidth={2} aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("dashboard.sidebar.closeMenu")}
          className="cursor-pointer grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-heading dark:hover:bg-white/5 md:hidden"
        >
          <X size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Nav */}
      <nav className="relative flex h-full flex-col overflow-y-auto overflow-x-hidden py-3">
        {MENU.map((section) => (
          <div key={section.titleKey} className="mb-2 flex flex-col">
            <span className={`block px-6 pb-1 pt-3 text-xs font-bold uppercase tracking-[1.4px] text-muted/70 md:hidden ${lg("lg:block")}`}>
              {t(section.titleKey)}
            </span>

            {section.items.map(({ labelKey, href, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`group relative py-1 flex items-center gap-3 border-l-4 px-4 my-3 transition-colors
                    md:mx-2 md:justify-center md:gap-0 md:rounded-xl md:border-l-0 md:px-0
                    ${lg("lg:mx-0 lg:justify-start lg:gap-3 lg:rounded-none lg:border-l-4 lg:px-4")}
                    ${active
                      ? `border-primary text-primary md:border-transparent md:bg-primary/10 ${lg("lg:border-primary lg:bg-transparent")}`
                      : "border-transparent text-muted"
                    }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden />

                  <span className={`${active ? "text-primary" : ""} block md:hidden ${lg("lg:block")} text-base font-medium`}>{t(labelKey)}</span>

                  {/* Tooltip — shown whenever the sidebar is a rail (md, or collapsed lg) */}
                  <span className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-heading opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block ${lg("lg:hidden")}`}>
                    {t(labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Bottom — support access */}
        <div className="mt-auto">
          {/* Compact support icon — shown in rail mode (md, or collapsed lg) */}
          <div className={`hidden px-2 pb-4 md:flex md:justify-center ${lg("lg:hidden")}`}>
            <Link
              href="/dashboard/support"
              onClick={onClose}
              aria-label={t("dashboard.sidebar.helpBtn")}
              className="group relative grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
            >
              <Headphones size={18} strokeWidth={2} aria-hidden />
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-heading opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
                {t("dashboard.sidebar.helpBtn")}
              </span>
            </Link>
          </div>

          {/* Full help card — drawer + expanded sidebar */}
          <div className={`px-3 pb-4 md:hidden ${lg("lg:block")}`}>
            <div className="relative overflow-hidden rounded-2xl p-4"
              style={{ backgroundImage: "url('/assets/dashboard/sidbar/side-bg.webp')", backgroundSize: "cover", backgroundPosition: "center" }}>
              <div aria-hidden className="absolute inset-0 bg-black/58" />

              <div className="relative space-y-3">
                {/* live indicator */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{t("dashboard.sidebar.liveSupport")}</span>
                </div>

                {/* text */}
                <div>
                  <p className="text-base font-bold leading-tight text-white">{t("dashboard.sidebar.helpTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{t("dashboard.sidebar.helpSub")}</p>
                </div>

                {/* ghost button */}
                <Link
                  href="/dashboard/support"
                  onClick={onClose}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:border-primary hover:bg-primary"
                >
                  <Headphones size={13} strokeWidth={2.5} aria-hidden />
                  {t("dashboard.sidebar.helpBtn")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
