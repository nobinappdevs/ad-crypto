"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useAuthMirror } from "@/hooks/useAuthMirror";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/components/ui/cn";
import { NAV_LINKS, isNavActive } from "@/config/nav";
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
  // Through the same store the guards read, so signing in or out — in this tab or
  // another — changes what this bar offers without waiting for a reload.
  const { authed } = useAuthMirror();
  const { hidden, scrolled } = useHideOnScroll();
  const [open, setOpen] = useState(false);

  /** `usePathname` is typed nullable; normalised once so `isNavActive` stays simple. */
  const path = pathname ?? "";

  /**
   * A route change should never leave the mobile sheet hanging open.
   *
   * Adjusted DURING render by comparing against the path the sheet was last drawn
   * under, not in an effect. An effect would paint the new route with the sheet
   * still open and then close it on a second pass — a visible flash on a slow
   * phone, which is the only place this sheet exists at all.
   */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

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
      {/* The three tracks are equal `flex-1` columns rather than two pinned
          420px rails: at 1024-1150px those rails plus the 160px wordmark added up
          to more than the viewport, so the login button was pushed off-screen.
          Equal flexible columns centre the wordmark the same way at wide widths
          and simply give ground as the bar tightens. */}
      <nav className="flex h-18 items-center gap-3 px-4 sm:h-22 sm:gap-4 sm:px-8 xl:px-14">
        <div className="flex flex-1 items-center gap-6 xl:gap-8.5">
          <Link href="/" aria-label={t("brand.name")} className="lg:hidden!">
            <Logo />
          </Link>
          {/* Five links, so the row runs tighter than the original four. */}
          <div className="hidden items-center gap-5 lg:flex xl:gap-7">
            {NAV_LINKS.map((link) => {
              const active = isNavActive(path, link.href);
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav flex! h-11 items-center whitespace-nowrap text-[15px] transition-colors duration-200 hover:text-hero-fg",
                    active ? "font-semibold text-hero-fg" : "font-medium text-hero-fg/75",
                  )}
                >
                  {/* The rule is anchored to this span, not to the 44px link box, so
                      it underlines the WORD rather than floating below it. */}
                  <span className="relative">
                    {t(link.key)}
                    {/* Active and hover share one mechanism: a rule that scales in
                        from the centre. Active holds it open in the brand colour
                        with a soft bloom; any other link grows a dim one under the
                        pointer. Two states, one visual language — and because it is
                        a `scale-x` on a pseudo-layer, nothing in the row reflows. */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full transition-transform duration-300 ease-out",
                        active
                          ? "scale-x-100 bg-hero-accent shadow-[0_0_10px_rgb(var(--hero-accent)/0.55)]"
                          : "scale-x-0 bg-hero-fg/35 group-hover/nav:scale-x-100",
                      )}
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/"
          aria-label={t("brand.name")}
          className="hidden! flex-1 items-center justify-center lg:flex!"
        >
          <Logo />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher variant="hero" />
          <ThemeToggle variant="hero" />

          {/* Hidden below `sm`, and the sheet carries it instead. The wordmark, the
              language pill, the theme toggle, this CTA and the burger together need
              ~397px of row, so on a 320-390px viewport the burger — the only way
              into the rest of the nav — was the thing pushed off the edge. The
              sheet's duplicate link was already written for exactly this split. */}
          <Link
            href={authed ? "/dashboard" : "/login"}
            className="hidden! h-9 items-center rounded-full bg-hero-accent px-4 text-[13px] font-semibold whitespace-nowrap text-white shadow-[0_8px_22px_rgb(var(--hero-accent)/0.4)] transition duration-200 hover:-translate-y-px hover:bg-hero-accent-soft hover:text-white sm:inline-flex! sm:h-10 sm:px-5 sm:text-[14px]"
          >
            {authed ? t("nav.dashboard") : t("nav.login")}
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
            {NAV_LINKS.map((link) => {
              const active = isNavActive(path, link.href);
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  // A left rule and a tint, not an underline: in a stacked list a
                  // rule under one row reads as a divider between two of them. This
                  // is also what the dashboard rail does, so "you are here" looks
                  // the same on both sides of the product.
                  //
                  // Every row carries the same padding whether it is active or not,
                  // so the marker appearing never shifts the label sideways.
                  className={cn(
                    "relative rounded-lg py-3 ps-3.5 text-[15px]! transition-colors",
                    active
                      ? "bg-hero-accent/8 font-semibold! text-hero-fg"
                      : "text-hero-fg/75",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-hero-accent"
                    />
                  )}
                  {t(link.key)}
                </Link>
              );
            })}
            {/* Stands in for the header CTA below `sm`, so it has to cover the
                authed case too — otherwise a signed-in visitor on a phone has no
                route to the dashboard at all. */}
            <Link
              href={authed ? "/dashboard" : "/login"}
              className="py-3 ps-3.5 text-[15px]! text-hero-fg/75 sm:hidden!"
            >
              {authed ? t("nav.dashboard") : t("nav.login")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
