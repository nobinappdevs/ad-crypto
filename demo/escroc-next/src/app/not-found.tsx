"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, LayoutDashboard, ShieldOff } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useIsClient } from "@/hooks/useIsClient";
import { TOKEN_KEY } from "@/lib/axios";
import logo from "../../public/assets/navbar/logo.webp";
import bannerBg from "@public/assets/banner/bannerbg.webp";

const QUICK_LINKS = [
  { key: "nav.about", href: "/about" },
  { key: "nav.services", href: "/services" },
  { key: "nav.features", href: "/features" },
  { key: "nav.contact", href: "/contact" },
];

/**
 * App-wide 404. Lives at the root (not inside a route group) so it catches
 * every unmatched path, including under (dashboard) and (auth) — which means
 * it can't rely on any group layout's Navbar/Footer and has to be fully
 * self-contained. Reuses the auth pages' decorative language (radial glow,
 * watermark, rings, dot grid) so it still feels like the same product.
 */
export default function NotFound() {
  const { t } = useLang();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(window.localStorage.getItem(TOKEN_KEY)) : false;

  return (
    <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg/95 px-4 py-14 text-center sm:px-6">
      {/* radial glow — same signature as the homepage hero / auth pages */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-15%] -z-10 h-md w-md -translate-x-1/2 animate-pulse rounded-full bg-primary/20 blur-[140px]"
      />

      {/* giant ESCROC wordmark watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 select-none justify-center overflow-hidden lg:flex"
      >
        <Image src={bannerBg} alt="" className="w-[min(1400px,94%)] max-w-none opacity-[0.07] dark:opacity-[0.06]" />
      </div>

      {/* concentric rings — top-left, wide screens only */}
      <div aria-hidden className="pointer-events-none absolute left-8 top-20 hidden select-none xl:block">
        <div className="relative h-48 w-48">
          <div className="absolute inset-0 rounded-full border border-primary/16" />
          <div className="absolute inset-6 rounded-full border border-primary/12" />
          <div className="absolute inset-12 rounded-full border border-primary/10" />
          <div className="absolute inset-16 rounded-full bg-primary/8 blur-sm" />
        </div>
      </div>

      {/* dot grid — bottom-right, wide screens only */}
      <div aria-hidden className="pointer-events-none absolute bottom-20 right-10 hidden select-none xl:block">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-primary" style={{ opacity: 0.04 + (i % 6) * 0.025 }} />
          ))}
        </div>
      </div>

      {/* logo — the only way back if a user lands here with no chrome around them */}
      <Link href="/" className="relative z-10 mb-10 inline-block">
        <Image src={logo} alt={t("brand.name")} width={1583} height={468} priority className="h-auto w-28" />
      </Link>

      {/* vault motif — an orbiting dashed ring around a "security switched off"
          badge, with the 4/0 digits drifting loose like they escaped the vault */}
      <div className="relative z-10 mx-auto h-36 w-36 sm:h-44 sm:w-44">
        <div className="absolute inset-0 rounded-full border border-dashed border-primary/25 [animation:spin-slow_18s_linear_infinite]" />
        <div className="absolute inset-6 rounded-full border border-primary/12 sm:inset-8" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [animation:float-y_3s_ease-in-out_infinite]">
          <span className="grid h-20 w-20 place-items-center rounded-3xl bg-linear-to-br from-primary to-primary/70 text-white shadow-xl shadow-primary/30 sm:h-24 sm:w-24">
            <ShieldOff size={36} strokeWidth={1.75} aria-hidden />
          </span>
        </span>
        <span aria-hidden className="absolute -right-1 -top-2 rotate-6 text-3xl font-black text-primary/20 sm:text-4xl">4</span>
        <span aria-hidden className="absolute -left-2 bottom-1 -rotate-6 text-3xl font-black text-primary/15 sm:text-4xl">0</span>
      </div>

      <p className="relative z-10 mt-6 bg-linear-to-br from-primary to-primary/50 bg-clip-text text-7xl font-black leading-none tracking-tight text-transparent sm:text-8xl">
        404
      </p>

      <h1 className="relative z-10 mt-4 text-2xl font-black tracking-tight text-heading sm:text-3xl">
        {t("notFound.title")}
      </h1>
      <p className="relative z-10 mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
        {t("notFound.subtitle")}
      </p>

      {/* CTAs */}
      <div className="relative z-10 mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-primary to-primary/90 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-primary/30 active:translate-y-0"
        >
          <Home size={16} strokeWidth={2.5} aria-hidden />
          {t("notFound.backHome")}
        </Link>
        <Link
          href={authed ? "/dashboard" : "/login"}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-7 py-3.5 text-sm font-bold text-heading transition hover:border-primary/40 hover:text-primary"
        >
          <LayoutDashboard size={16} strokeWidth={2.5} aria-hidden />
          {authed ? t("nav.dashboard") : t("auth.login")}
        </Link>
      </div>

      {/* quick links */}
      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-muted/60">{t("notFound.quickLinks")}</span>
        {QUICK_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="font-medium text-primary hover:underline">
            {t(l.key)}
          </Link>
        ))}
      </div>
    </section>
  );
}
