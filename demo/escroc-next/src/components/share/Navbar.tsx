"use client";

import { useEffect, useRef, useState } from "react";
import { User, Menu, X, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLang } from "@/hooks/useLang";
import { useIsClient } from "@/hooks/useIsClient";
import { TOKEN_KEY } from "@/lib/axios";
import { ThemeToggle } from "@/components/share/ThemeToggle";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";
import logo from "../../../public/assets/navbar/logo.webp";

const NAV_ITEMS = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.services", href: "/services" },
  { key: "nav.features", href: "/features" },
  { key: "nav.blog", href: "/blog" },
  { key: "nav.contact", href: "/contact" },
];

function getActiveKey(pathname) {
  if (pathname === "/") return "nav.home";
  for (const item of NAV_ITEMS) {
    if (item.href === "/") continue;
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return item.key;
  }
  return "nav.home";
}

function UserIcon() {
  return <User size={16} strokeWidth={2} aria-hidden />;
}

function MenuIcon({ open }) {
  return open ? <X size={22} strokeWidth={2} aria-hidden /> : <Menu size={22} strokeWidth={2} aria-hidden />;
}

function LoginButton({ full = false }) {
  const { t } = useLang();
  const isClient = useIsClient();
  // Server + first paint render the logged-out state (matches SSR → no
  // hydration mismatch); after mount we swap to "Dashboard" when a token exists.
  const authed = isClient ? Boolean(window.localStorage.getItem(TOKEN_KEY)) : false;

  return (
    <Link
      href={authed ? "/dashboard" : "/login"}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30 ${
        full ? "w-full" : ""
      }`}
    >
      <span aria-hidden className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {authed ? <LayoutDashboard size={16} strokeWidth={2} aria-hidden /> : <UserIcon />}
      {authed ? t("nav.dashboard") : t("auth.login")}
    </Link>
  );
}

export function Navbar() {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const moveTo = (key) => {
    const el = linkRefs.current[key];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  };

  useEffect(() => {
    moveTo(activeKey);
    const onResize = () => moveTo(activeKey);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeKey, lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled ? "border-border bg-bg/80 backdrop-blur-xl" : "border-transparent bg-bg/40 backdrop-blur-md"
      }`}
    >
      <div aria-hidden className="h-px w-full bg-linear-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src={logo} alt={t("brand.name")} width={1583} height={468} priority className="h-auto w-36" />
        </Link>

        {/* Center nav with sliding indicator */}
        <nav
          onMouseLeave={() => moveTo(activeKey)}
          className="relative hidden items-center lg:flex"
        >
          <span
            aria-hidden
            className="absolute top-1/2 z-0 h-9 -translate-y-1/2 rounded-full bg-primary/12 ring-1 ring-primary/20 transition-all duration-300 ease-out"
            style={{ left: pill.left, width: pill.width, opacity: pill.ready ? 1 : 0 }}
          />
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                ref={(el) => { linkRefs.current[item.key] = el; }}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={() => moveTo(item.key)}
                className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted hover:text-heading"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <LoginButton />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-body transition-colors hover:border-primary/40 hover:text-primary"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="absolute inset-x-4 top-full mt-2 rounded-2xl border border-border bg-card/95 p-3 shadow-card backdrop-blur-xl sm:inset-x-6 lg:hidden">
            <nav className="flex flex-col">
              {NAV_ITEMS.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-body hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>

            <div className="my-3 h-px bg-border" />

            <div className="flex items-center justify-between px-1 pb-3">
              <LanguageSwitcher />
            </div>
            <LoginButton full />
          </div>
        )}
      </div>
    </header>
  );
}
