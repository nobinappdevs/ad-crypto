"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useIsClient } from "@/hooks/useIsClient";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { TOKEN_KEY } from "@/lib/axios";
import { cn } from "@/components/ui/cn";
import { NAV_LINKS } from "@/config/nav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

/**
 * The banner's nav bar, and the only nav the public site has. It is `fixed` and
 * overlays the banner, so every page's opening section carries enough top
 * padding to clear it.
 */
export function Navbar() {
  const { t } = useLang();
  const pathname = usePathname();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;
  const { hidden, scrolled } = useHideOnScroll();
  const [open, setOpen] = useState(false);

  // A route change should never leave the mobile sheet hanging open.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-out",
        // The open sheet must stay put even if the scroll handler wants to hide
        // the bar, otherwise tapping a link chases a moving target.
        hidden && !open ? "-translate-y-full" : "translate-y-0",
        // Past the banner's top the bar needs its own backdrop, otherwise it
        // sits unreadably over whatever section scrolled underneath it.
        (scrolled || open) && "border-b border-hero-border bg-hero-bg/80 backdrop-blur-md",
      )}
    >
      <nav className="flex h-18 items-center gap-3 px-4 sm:h-22 sm:gap-4 sm:px-8 lg:px-14">
        <div className="flex flex-1 items-center gap-6 lg:w-105 lg:flex-none xl:gap-8.5">
          <Link href="/" aria-label={t("brand.name")} className="lg:hidden!">
            <Logo />
          </Link>
          {/* Five links, so the row runs tighter than the original four. */}
          <div className="hidden items-center gap-5.5 lg:flex xl:gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "flex! h-11 items-center whitespace-nowrap text-[15px] font-medium transition-colors duration-200 hover:text-hero-fg",
                  pathname === link.href ? "text-hero-fg" : "text-hero-fg/88",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/"
          aria-label={t("brand.name")}
          className="hidden! flex-1 items-center justify-center lg:flex!"
        >
          <Logo />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-3 lg:w-105 lg:flex-none">
          <LanguageSwitcher variant="hero" />
          <ThemeToggle variant="hero" />

          {!authed && (
            <Link
              href="/login"
              // The shadow keeps this readable where it crosses the header's
              // chrome artwork, which is bright enough to swallow plain text.
              className="hidden! h-11 items-center text-[15px] font-medium whitespace-nowrap text-hero-fg drop-shadow-[0_1px_6px_rgb(0_0_0/0.65)] transition-colors duration-200 hover:text-hero-fg sm:flex!"
            >
              {t("nav.login")}
            </Link>
          )}

          <Link
            href={authed ? "/dashboard" : "/login"}
            className="inline-flex! h-9 items-center rounded-full bg-hero-accent px-4 text-[13px] font-semibold whitespace-nowrap text-white shadow-[0_8px_22px_rgb(var(--hero-accent)/0.4)] transition duration-200 hover:-translate-y-px hover:bg-hero-accent-soft hover:text-white sm:h-10 sm:px-5 sm:text-[14px]"
          >
            {authed ? t("nav.dashboard") : t("nav.signUp")}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t(open ? "nav.closeMenu" : "nav.openMenu")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hero-border text-hero-fg transition-colors duration-200 hover:bg-hero-surface lg:hidden"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-hero-border bg-hero-bg/95 backdrop-blur-md lg:hidden">
          <nav className="flex flex-col px-4 py-2 sm:px-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "py-3 text-[15px]!",
                  pathname === link.href ? "text-hero-fg" : "text-hero-fg/88",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
            {!authed && (
              <Link href="/login" className="py-3 text-[15px]! text-hero-fg/88 sm:hidden!">
                {t("nav.login")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
