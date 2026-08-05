"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import logo from "@public/assets/navbar/logo.webp";
import bannerBg from "@public/assets/banner/bannerbg.webp";

/**
 * Shared chrome for every auth page (login, register, forgot, OTP, reset).
 *
 * Mirrors the homepage hero's visual language — pulsing radial glow, the giant
 * ESCROC wordmark watermark, concentric rings, a dot grid, and a frosted glass
 * card — so signing in feels like the same product as the marketing site.
 */
export function AuthShell({
  title,
  subtitle,
  cardLabel,
  children,
  footer,
}: {
  /** Big centered headline above the card. */
  title: ReactNode;
  /** Supporting line under the headline. */
  subtitle?: ReactNode;
  /** Short uppercase eyebrow in the card header (e.g. "Login"). */
  cardLabel?: ReactNode;
  /** The form itself. */
  children: ReactNode;
  /** Link row rendered under the card. */
  footer?: ReactNode;
}) {
  const { t } = useLang();

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-bg/95 px-4 py-14 sm:px-6">
      {/* radial glow — same signature as the homepage hero */}
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

      <div className="relative w-full max-w-lg">
        {/* ── intro ── */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image src={logo} alt={t("brand.name")} width={1583} height={468} priority className="mx-auto h-auto w-32" />
          </Link>

          <h1 className="mt-7 text-3xl font-black leading-[1.1] tracking-tight text-heading sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-3.5 max-w-sm text-base leading-relaxed text-muted/90">{subtitle}</p>
          )}
        </div>

        {/* ── frosted glass card — the wordmark watermark reads through it ── */}
        <div className="glass-card relative mt-9 overflow-hidden rounded-3xl p-5 sm:p-7">
          {/* diagonal light sweep across the top-left corner */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-1/3 -top-2/3 h-full w-4/5 -rotate-12 bg-linear-to-br from-white/45 via-white/10 to-transparent blur-2xl dark:from-white/8 dark:via-white/3"
          />
          {/* faint primary bloom bleeding in from the bottom-right */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-primary/12 blur-3xl"
          />

          {/* card header — label + secured chip, mirroring the hero form.
              `relative` keeps it above the decorative sweeps above. */}
          {cardLabel && (
            <div className="relative mb-6 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-bold uppercase tracking-wider text-heading/90">{cardLabel}</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/50 px-3 py-1 text-xs font-medium text-muted/80 backdrop-blur-sm dark:bg-white/5">
                <ShieldCheck size={13} strokeWidth={2.5} className="text-emerald-500" aria-hidden />
                {t("download.phone.secured")}
              </span>
            </div>
          )}

          {/* `glass-fields` turns the filled input wrappers translucent so the
              frost reads through them instead of stopping at a solid box. */}
          <div className="glass-fields relative">{children}</div>
        </div>

        {/* ── footer link ── */}
        {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}

        {/* ── trust row — same three proofs as the homepage hero ── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 px-2 text-xs text-muted/80">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} strokeWidth={2} className="text-emerald-500" aria-hidden />
            {t("banner.trust.secured")}
          </span>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-border sm:inline" />
          <span>
            <strong>250k+</strong> {t("banner.trust.verified")}
          </span>
          <span aria-hidden className="hidden h-1 w-1 rounded-full bg-border sm:inline" />
          <span>{t("banner.trust.noFees")}</span>
        </div>
      </div>
    </section>
  );
}
