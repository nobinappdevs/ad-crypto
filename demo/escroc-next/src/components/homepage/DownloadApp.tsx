"use client";

import { Bell, ArrowUpRight, Send, ArrowDownLeft, Plus, MoreHorizontal, Home, Wallet, Clock, Check } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";

function AppleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13z" />
      <path d="M14.69 4.46c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.58 3.03-1.46z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 3.5 14.5 12 4 20.5z" fill="#34d399" />
      <path d="M4 3.5 11 10.5l3.5-1.5z" fill="#60a5fa" />
      <path d="M4 20.5 11 13.5l3.5 1.5z" fill="#f87171" />
      <path d="M14.5 9 18 11c1 .6 1 1.4 0 2l-3.5 2L11 12z" fill="#fbbf24" />
    </svg>
  );
}

const TXNS = [
  { icon: "↑", label: "Sent to Sarah K.",   sub: "download.phone.completed", amount: "-$200",  color: "text-rose-500",    bg: "bg-rose-500/10"    },
  { icon: "🔒", label: "Escrow: Tech Deal",  sub: "download.phone.secured",   amount: "$1,200", color: "text-primary",     bg: "bg-primary/10"     },
  { icon: "↓", label: "From Marcus T.",     sub: "download.phone.received",  amount: "+$850",  color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const CHART = [38, 55, 42, 70, 50, 85, 62];

function PhoneFrame() {
  const { t } = useLang();

  return (
    <div className="relative mx-auto w-64 sm:w-72">
      {/* Glow behind phone */}
      <div aria-hidden className="absolute -inset-6 rounded-[64px] bg-linear-to-br from-primary/40 via-primary/20 to-transparent blur-[60px]" />

      {/* Side buttons */}
      <div aria-hidden className="absolute -left-0.75 top-28 h-12 w-0.75 rounded-l bg-heading/15" />
      <div aria-hidden className="absolute -left-0.75 top-44 h-16 w-0.75 rounded-l bg-heading/15" />
      <div aria-hidden className="absolute -right-0.75 top-36 h-20 w-0.75 rounded-r bg-heading/15" />

      {/* Frame */}
      <div className="relative overflow-hidden rounded-[52px] border-8 border-heading/12 bg-bg shadow-2xl ring-1 ring-white/10">
        {/* inner bezel highlight */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 rounded-[44px] ring-1 ring-inset ring-white/10" />

        {/* App header */}
        <div className="relative overflow-hidden bg-linear-to-br from-primary via-primary to-primary/60 px-5 pb-16 pt-3">
          {/* header decoration */}
          <div aria-hidden className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />

          {/* Status bar */}
          <div className="relative flex items-center justify-between pb-4">
            <span className="text-[9px] font-bold text-white/90">9:41</span>
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-0 h-5.5 w-18 -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/5">
              <div className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center gap-1">
              <svg width="13" height="9" viewBox="0 0 18 12" fill="white" opacity="0.9" aria-hidden><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="1" width="3" height="11" rx="1"/></svg>
              <svg width="13" height="9" viewBox="0 0 16 12" fill="white" opacity="0.9" aria-hidden><path d="M8 2.5C5.5 2.5 3.3 3.5 1.7 5L0 3.3C2.1 1.2 5 0 8 0s5.9 1.2 8 3.3L14.3 5C12.7 3.5 10.5 2.5 8 2.5z"/><circle cx="8" cy="9" r="2"/></svg>
              <div className="ml-0.5 flex h-2.5 w-5 items-center rounded-sm border border-white/70 px-px"><div className="h-1.5 w-3.5 rounded-[1px] bg-white/90"/></div>
            </div>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-xs font-black text-white ring-1 ring-white/20">E</div>
              <div className="leading-tight">
                <span className="text-[8px] font-medium text-white/60">{t("download.phone.welcome")}</span>
                <span className="text-[11px] font-bold text-white">Alex Morgan</span>
              </div>
            </div>
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
              <Bell size={13} strokeWidth={2.5} stroke="white" aria-hidden />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-400 ring-2 ring-primary" />
            </div>
          </div>
        </div>

        {/* Balance card (overlapping) */}
        <div className="relative z-10 -mt-12 px-4">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-medium text-muted">{t("download.phone.totalBalance")}</p>
                <p className="text-[22px] font-black tracking-tight text-heading">$12,450.00</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
                <ArrowUpRight size={9} strokeWidth={3} stroke="rgb(16 185 129)" aria-hidden />
                <span className="text-[8px] font-bold text-emerald-600">12.5%</span>
              </span>
            </div>

            {/* Mini chart */}
            <div className="mt-3 flex h-12 items-end justify-between gap-1.5">
              {CHART.map((h, i) => (
                <div key={i} className="flex-1 rounded-full bg-linear-to-t from-primary/30 to-primary" style={{ height: `${h}%`, opacity: i === CHART.length - 1 ? 1 : 0.45 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-3 flex justify-between gap-2 px-4">
          {[
            { l: "download.phone.send",    Icon: Send },
            { l: "download.phone.request", Icon: ArrowDownLeft },
            { l: "download.phone.topUp",  Icon: Plus },
            { l: "download.phone.more",    Icon: MoreHorizontal },
          ].map((a) => (
            <div key={a.l} className="flex flex-1 flex-col items-center gap-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <a.Icon size={14} strokeWidth={2.4} aria-hidden />
              </span>
              <span className="text-[8px] font-semibold text-muted">{t(a.l)}</span>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="px-4 pb-3 pt-4">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{t("download.phone.recentActivity")}</p>
            <span className="text-[9px] font-semibold text-primary">{t("download.phone.seeAll")}</span>
          </div>
          <div className="space-y-2">
            {TXNS.map((tx) => (
              <div key={tx.label} className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] ${tx.bg}`}>
                  {tx.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold leading-tight text-heading">{tx.label}</p>
                  <p className="text-[9px] text-muted">{t(tx.sub)}</p>
                </div>
                <p className={`text-[10px] font-bold ${tx.color}`}>{tx.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-around border-t border-border/60 bg-card/50 px-4 pb-1 pt-2.5">
          {[Home, Wallet, Clock].map((NavIcon, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <NavIcon size={16} strokeWidth={2} stroke={i === 0 ? "rgb(var(--primary__color))" : "currentColor"} className={i === 0 ? "" : "text-muted/50"} aria-hidden />
              {i === 0 && <span className="h-1 w-1 rounded-full bg-primary" />}
            </div>
          ))}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center bg-card/50 pb-2 pt-1">
          <div className="h-1 w-24 rounded-full bg-heading/20" />
        </div>
      </div>

      {/* Floating badge: Secured */}
      <div className="absolute -right-8 top-1/3 flex animate-[floaty_6s_ease-in-out_infinite] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-card">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] text-emerald-600">✓</div>
        <div>
          <p className="text-[10px] font-bold leading-none text-heading">{t("download.phone.secured")}</p>
          <p className="mt-0.5 text-[8px] text-muted">{t("download.phone.escrowActive")}</p>
        </div>
      </div>

      {/* Floating badge: Instant */}
      <div className="absolute -left-7 bottom-1/4 flex animate-[floaty_7s_ease-in-out_infinite] items-center gap-2 rounded-2xl bg-primary px-3 py-2 shadow-lg shadow-primary/30">
        <span className="text-sm">⚡</span>
        <p className="text-[10px] font-bold text-white">{t("download.phone.instantTransfer")}</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { title: "Bank-grade escrow", desc: "Every payment held safely until both sides confirm." },
  { title: "Global reach", desc: "Instant transfers across 190+ countries, any currency." },
  { title: "Live tracking", desc: "Real-time status & push alerts on every transaction." },
];

const STATS = [
  { value: "50K+", label: "download.statDownloads" },
  { value: "4.9★", label: "download.statRating" },
  { value: "190+", label: "download.statCountries" },
];

export function DownloadApp() {
  const { t } = useLang();

  const featuresRaw = t("download.features");
  const features = Array.isArray(featuresRaw)
    ? (featuresRaw as { title: string; desc: string }[])
    : [];

  return (
    <section className="overflow-hidden  py-24 lg:py-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">

          {/* ── Left: content ── */}
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {t("download.tag")}
            </span>

            <h2 className="mt-5">{t("download.title")}</h2>

            <p className="mt-4 leading-relaxed text-muted">
              {t("download.subtitle")}
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-4">
              {features.map((f, i) => (
                <li key={FEATURES[i]?.title ?? f.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Check size={14} strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-heading">{f.title}</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">{f.desc}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Store badges */}
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="https://www.apple.com/app-store"
                target="_blank"
                className="flex items-center gap-3 rounded-2xl bg-heading text-white dark:text-black px-5 py-3 transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                <AppleLogo />
                <span className="text-left leading-tight">
                  <small className="block text-[9px] uppercase tracking-widest text-white/60 dark:text-black/60">
                    {t("download.appStore.label")}
                  </small>
                  <strong className="block text-sm font-bold text-white dark:text-black">{t("download.appStore.store")}</strong>
                </span>
              </a>
              <a
                href="https://play.google.com/store/games?device=windows"
                target="_blank"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-heading transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
              >
                <PlayLogo />
                <span className="text-left leading-tight">
                  <small className="block text-[9px] uppercase tracking-widest text-muted">
                    {t("download.googlePlay.label")}
                  </small>
                  <strong className="block text-sm font-bold">{t("download.googlePlay.store")}</strong>
                </span>
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-9 flex divide-x divide-border">
              {STATS.map((s) => (
                <div key={s.label} className="px-5 first:pl-0">
                  <p className="text-xl font-black text-heading">{s.value}</p>
                  <p className="text-[11px] font-medium text-muted">{t(s.label)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: phone ── */}
          <div className="flex justify-center lg:justify-end lg:pr-10">
            <PhoneFrame />
          </div>

        </div>
      </Container>
    </section>
  );
}
