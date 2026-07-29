"use client";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { useIsClient } from "@/hooks/useIsClient";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { TOKEN_KEY } from "@/lib/axios";
import { cn } from "@/components/ui/cn";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";
import { ThemeToggle } from "@/components/share/ThemeToggle";

/** Crosshair mark that stands in for the logo in the middle of the nav. */
function BrandMark() {
  return (
    <span
      aria-hidden
      className="relative block h-7.5 w-7.5 rounded-full border-[1.5px] border-hero-fg/90"
    >
      <span className="absolute left-1/2 top-0.5 bottom-0.5 w-[1.5px] -translate-x-1/2 bg-hero-fg/90" />
      <span className="absolute top-1/2 left-0.5 right-0.5 h-[1.5px] -translate-y-1/2 bg-hero-fg/90" />
    </span>
  );
}

const NAV_LINKS = [
  { key: "hero.navInvesting", href: "#" },
  { key: "hero.navCash", href: "#" },
  { key: "hero.navPlanning", href: "#" },
  { key: "hero.navAbout", href: "/about" },
];

export function HeroNav() {
  const { t } = useLang();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;
  const { hidden, scrolled } = useHideOnScroll();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-18 items-center gap-3 px-4 transition-transform duration-500 ease-out sm:h-22 sm:gap-4 sm:px-8 lg:px-14",
        hidden ? "-translate-y-full" : "translate-y-0",
        // Once past the hero's top the bar needs its own backdrop, otherwise it
        // sits unreadably over whatever section scrolled underneath it.
        scrolled && "border-b border-hero-border bg-hero-bg/80 backdrop-blur-md",
      )}
    >
      <div className="flex flex-1 items-center gap-6 lg:w-105 lg:flex-none xl:gap-8.5">
        <span className="lg:hidden">
          <BrandMark />
        </span>
        <div className="hidden items-center gap-8.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="flex! h-11 items-center whitespace-nowrap text-[15px] font-medium text-hero-fg/88 transition-colors duration-200 hover:text-hero-fg"
            >
              {t(link.key)}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden flex-1 justify-center lg:flex">
        <BrandMark />
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3 lg:w-105 lg:flex-none">


        <LanguageSwitcher variant="hero" />
        <ThemeToggle variant="hero" />

        {!authed && (
          <Link
            href="/login"
            className="hidden! h-11 items-center text-[15px] font-medium whitespace-nowrap text-hero-fg/88 transition-colors duration-200 hover:text-hero-fg sm:flex!"
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
      </div>
    </nav>
  );
}
