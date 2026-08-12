"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ShieldCheck, BadgeCheck, Lock, Zap, Scale } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { StatusBadge, dsx } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";
import { useDashboard } from "@/hooks/useDashboard";
import { useRole } from "@/components/context/RoleContext";

import "swiper/css";

const PANEL        = dsx.card;
const PANEL_HEADER = dsx.header;

/* ── helpers ── */
const fmtMoney = (n: any) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ISO → "YYYY-MM-DD HH:mm" without locale (keeps SSR/client output identical).
const fmtDate = (iso?: string) => (iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "—");

/* ── data-driven line/area chart (drives both dashboard charts) ── */
const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtChartDay = (iso: string, months: string[]) => {
  const [, m, day] = (iso ?? "").split("-");
  return m && day ? `${day} ${months[Number(m) - 1]}` : iso;
};
const fmtTick = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const CW = 640, CH = 190, PAD_X = 30, PAD_TOP = 12, PAD_BOTTOM = 24;

type Series = { id: string; values: number[]; color: string; fill?: boolean };

/** Smooth cubic line (+ optional area) path for one series, scaled to `max`. */
function seriesPath(values: number[], max: number) {
  const n = values.length || 1;
  const innerW = CW - PAD_X * 2;
  const innerH = CH - PAD_TOP - PAD_BOTTOM;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const yOf = (v: number) => PAD_TOP + innerH - (max > 0 ? v / max : 0) * innerH;
  const pts = (values.length ? values : [0]).map((v, i) => [PAD_X + i * stepX, yOf(v)] as const);
  let line = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const mx = (x1 + x2) / 2;
    line += ` C ${mx.toFixed(1)} ${y1.toFixed(1)}, ${mx.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  const baseY = PAD_TOP + innerH;
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${baseY} L ${pts[0][0].toFixed(1)} ${baseY} Z`;
  return { line, area };
}

function LineChart({ series, labels, months }: { series: Series[]; labels: string[]; months: string[] }) {
  const rawMax = Math.max(0, ...series.flatMap((s) => s.values));
  const max = rawMax <= 0 ? 4 : Math.ceil(rawMax * 1.15);
  const innerH = CH - PAD_TOP - PAD_BOTTOM;
  const rows = [0, 1, 2, 3, 4];
  const every = Math.max(1, Math.ceil(labels.length / 8));
  const xTicks = labels.filter((_, i) => i % every === 0 || i === labels.length - 1);

  return (
    <div className="relative px-1">
      <svg viewBox={`0 0 ${CW} ${CH}`} className="block w-full overflow-visible">
        <defs>
          {series.filter((s) => s.fill).map((s) => (
            <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {rows.map((i) => {
          const y = PAD_TOP + (innerH * i) / 4;
          return (
            <g key={i}>
              <line x1={PAD_X} y1={y} x2={CW - PAD_X} y2={y} className="stroke-border" strokeWidth="1" strokeDasharray={i === 4 ? "0" : "3 4"} />
              <text x={PAD_X - 7} y={y + 3} textAnchor="end" className="fill-muted" fontSize="9">{fmtTick(max * (1 - i / 4))}</text>
            </g>
          );
        })}

        {series.map((s) => {
          const { line, area } = seriesPath(s.values, max);
          return (
            <g key={s.id}>
              {s.fill && <path d={area} fill={`url(#grad-${s.id})`} />}
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between px-1 font-mono text-[10px] text-muted">
        {xTicks.map((d, i) => <span key={i}>{fmtChartDay(d, months)}</span>)}
      </div>
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <i className="h-2 w-2 rounded-full" style={{ backgroundColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* Hero card is a trust panel, not a balance readout — deliberately money-free so
   no single wallet's figure can be mistaken for the account total. */
const VAULT_HIGHLIGHTS = [
  { key: "escrowLock",  labelKey: "dashboard.home.highlightLock",   Icon: Lock },
  { key: "release",     labelKey: "dashboard.home.highlightRelease", Icon: Zap },
  { key: "dispute",     labelKey: "dashboard.home.highlightDispute", Icon: Scale },
];

/* transaction-type → icon + readable label (matches the Transactions page) */
function txMeta(type: string) {
  const s = (type ?? "").toUpperCase();
  if (s.includes("ADD"))      return { Icon: ArrowDownLeft,  label: "dashboard.types.addMoney", cls: "bg-primary/10 text-primary" };
  if (s.includes("OUT"))      return { Icon: ArrowUpRight,   label: "dashboard.types.moneyOut", cls: "bg-amber-500/12 text-amber-500" };
  if (s.includes("EXCHANGE")) return { Icon: ArrowLeftRight, label: "dashboard.types.exchange",  cls: "bg-indigo-500/12 text-indigo-500" };
  if (s.includes("ESCROW"))   return { Icon: ShieldCheck,    label: "dashboard.types.escrow",    cls: "bg-primary/10 text-primary" };
  return { Icon: ArrowLeftRight, label: (type ?? "—").replace(/-/g, " "), cls: "bg-black/5 text-muted dark:bg-white/10" };
}

/* string_status → StatusBadge tone */
function statusTone(status: string) {
  const s = (status ?? "").toLowerCase();
  if (/success|complete|approved|paid|released/.test(s)) return "success";
  if (/pending|process/.test(s)) return "pending";
  if (/wait/.test(s)) return "info";
  if (/reject|fail|cancel|declin/.test(s)) return "danger";
  return "neutral";
}

/* ── loading skeleton (mirrors the layout) ── */
function HomeSkeleton() {
  return (
    <div className={`${dsx.page} flex flex-col gap-6`}>
      <div className="grid gap-7.5 min-[1200px]:grid-cols-[1.6fr_1fr]">
        <div className="h-72 animate-pulse rounded-2xl bg-border" />
        <div className="flex flex-col gap-4">
          <div className="h-5 w-36 animate-pulse rounded bg-border" />
          <div className="h-11 animate-pulse rounded-xl bg-border" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-border" />
            ))}
          </div>
        </div>
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-border" />
      <div className="grid gap-7.5 min-[1200px]:grid-cols-[1.6fr_1fr]">
        <div className="h-64 animate-pulse rounded-2xl bg-border" />
        <div className="h-64 animate-pulse rounded-2xl bg-border" />
      </div>
    </div>
  );
}

export function DashboardHome() {
  const { t } = useLang();
  const router = useRouter();

  const monthsRaw = t("dashboard.common.monthsShort");
  const months = Array.isArray(monthsRaw) ? (monthsRaw as string[]) : CHART_MONTHS;

  const { role } = useRole();
  const { data: res, isLoading } = useDashboard();
  const d = (res as any)?.data;
  const user = d?.user?.user;
  const wallets: any[] = Array.isArray(d?.userWallet) ? d.userWallet : [];
  const txns: any[] = Array.isArray(d?.transactions) ? d.transactions : [];

  // The dashboard response has no base_url — derive the storage base from the
  // user's image URL (userImage = base + default_image | image_path/image).
  const storageBase = (() => {
    const img: string | undefined = user?.userImage;
    if (!img) return "";
    const suffix = user?.image ? `${d?.user?.image_path}/${user.image}` : d?.user?.default_image;
    return suffix && img.endsWith(suffix) ? img.slice(0, img.length - suffix.length) : "";
  })();
  const flagUrl = (w: any) => (storageBase && w?.flag ? `${storageBase}${w.image_path}/${w.flag}` : "");

  const kycStatus = user?.kycStringStatus?.value as string | undefined;
  const kycOk = /verif|approv|success/i.test(kycStatus ?? "");

  const totalEscrow = Number(d?.total_escrow ?? 0);
  const ESCROW_STATS = [
    { labelKey: "dashboard.home.totalEscrow",     value: totalEscrow,                                             dot: "bg-primary",     bar: "bg-primary" },
    { labelKey: "dashboard.home.completedEscrow", value: Number(d?.compledted_escrow ?? d?.completed_escrow ?? 0), dot: "bg-emerald-500", bar: "bg-emerald-500" },
    { labelKey: "dashboard.home.pendingEscrow",   value: Number(d?.pending_escrow ?? 0),                          dot: "bg-amber-500",   bar: "bg-amber-500" },
    { labelKey: "dashboard.home.disputeEscrow",   value: Number(d?.dispute_escrow ?? 0),                          dot: "bg-rose-500",    bar: "bg-rose-500" },
  ].map((s) => ({ ...s, width: totalEscrow > 0 ? `${Math.round((s.value / totalEscrow) * 100)}%` : "0%" }));

  // Chart series from the API's chartData (month-to-date).
  const chart = d?.chartData ?? {};
  const chartDays: string[] = Array.isArray(chart.month_day) ? chart.month_day : [];
  const escrowSeries: Series[] = [
    { id: "escrow", values: chart.chart_one_data?.released_escrow_by_month ?? [], color: "var(--color-primary)", fill: true },
  ];
  const FLOW_COLORS = { add: "#3b82f6", out: "#f59e0b", exchange: "#10b981" };
  const flowSeries: Series[] = [
    { id: "add",      values: chart.chart_two_data?.add_money ?? [],      color: FLOW_COLORS.add },
    { id: "out",      values: chart.chart_two_data?.money_out ?? [],      color: FLOW_COLORS.out },
    { id: "exchange", values: chart.chart_two_data?.exchange_money ?? [], color: FLOW_COLORS.exchange },
  ];

  const QUICK_ACTIONS = [
    { key: "withdrawal",    labelKey: "dashboard.home.withdrawal",    href: "/dashboard/money-out",     path: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" /> },
    { key: "convertFX",     labelKey: "dashboard.home.convertFX",     href: "/dashboard/exchange",      path: <path d="m17 3 4 4-4 4M21 7H7M7 21l-4-4 4-4M3 17h14" /> },
    { key: "createEscrow",  labelKey: "dashboard.home.createEscrow",  href: "/dashboard/create-escrow", path: <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" /> },
    { key: "securityPanel", labelKey: "dashboard.home.securityPanel", href: "/dashboard/security",      path: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></> },
  ];

  // Skeleton on first load.
  if (isLoading && !d) return <HomeSkeleton />;

  return (
    <div className={`${dsx.page} flex flex-col gap-6`}>
      {/* Hero: vault card + quick controls */}
      <section className="grid gap-7.5 min-[1200px]:grid-cols-[1.6fr_1fr]">
        {/* Vault card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 to-slate-800 p-5 text-slate-50 shadow-xl sm:p-8 dark:border-white/5 dark:from-[#070a0e] dark:to-[#111823]">
          <div aria-hidden className="pointer-events-none absolute right-[-20%] -top-1/2 h-75 w-75 rounded-full bg-[radial-gradient(circle,rgba(68,160,141,0.15)_0%,transparent_70%)]" />

          {/* soft grid texture — keeps the large empty area from reading as flat */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:38px_38px] [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_70%)]"
          />

          <div className="relative flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 [&>svg]:size-4 [&>svg]:text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"/></svg>
              {t("dashboard.home.vaultLabel")}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-xs text-slate-50">
              <i className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
              {t("dashboard.home.vaultStatus")}
            </span>
          </div>

          <div className="relative my-6 flex items-start gap-4 sm:my-7 sm:gap-5">
            {/* emblem */}
            <span className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/12 text-primary shadow-[0_0_25px_-6px_var(--color-primary)] sm:h-15 sm:w-15 [&>svg]:size-6.5 sm:[&>svg]:size-7.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" />
                <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-snug tracking-tight text-slate-50 sm:text-2xl">
                {t("dashboard.home.vaultTitle")}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{t("dashboard.home.vaultDesc")}</p>
            </div>
          </div>

          {/* trust highlights */}
          <div className="relative mb-6 flex flex-wrap gap-2">
            {VAULT_HIGHLIGHTS.map((h) => (
              <span
                key={h.key}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-primary/40 hover:text-slate-50"
              >
                <h.Icon size={14} strokeWidth={2.2} className="shrink-0 text-primary" aria-hidden />
                {t(h.labelKey)}
              </span>
            ))}
          </div>

          <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-5 sm:pt-6">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">{t("dashboard.home.origin")}</span>
              <span className="truncate text-sm font-semibold capitalize text-slate-300">
                {`${user?.fullname ?? "You"} (${role})`}
              </span>
            </div>
            {/* connector — needs real width to read as a link, so it's dropped on narrow cards */}
            <div className="relative mx-5 hidden flex-1 items-center justify-center sm:flex">
              <div className="h-0.5 w-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0_4px,transparent_4px_8px)]" />
              <div className="absolute grid h-9 w-9 place-items-center rounded-full bg-primary text-white shadow-[0_0_15px_rgba(68,160,141,0.4)] [&>svg]:size-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
              </div>
            </div>
            <div className="flex min-w-0 flex-col items-end gap-1 text-right">
              <span className="text-xs uppercase tracking-wide text-slate-400">{t("dashboard.home.verification")}</span>
              <span className={`flex min-w-0 items-center gap-1.5 text-sm font-semibold ${kycOk ? "text-primary" : "text-amber-400"}`}>
                <BadgeCheck size={15} strokeWidth={2.2} className="shrink-0" aria-hidden />
                <span className="truncate">{kycStatus ?? t("dashboard.home.kycUnknown")}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-heading">{t("dashboard.home.quickControls")}</h3>
          <Button
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<Plus size={18} strokeWidth={2.5} aria-hidden />}
            onClick={() => router.push("/dashboard/add-money")}
          >
            {t("dashboard.home.initAddMoney")}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.key} href={a.href} className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-4.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-black/5 text-primary dark:bg-white/5 [&>svg]:size-4.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{a.path}</svg>
                </span>
                <span className="text-sm font-semibold text-heading">{t(a.labelKey)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet balances */}
      <section className={PANEL}>
        <div className={PANEL_HEADER}>
          <h3 className="text-base font-bold tracking-tight text-heading">{t("dashboard.home.balances")}</h3>
        </div>
        {wallets.length > 0 && (
          <div className="px-5 py-6">
            <Swiper
              modules={[Autoplay]}
              spaceBetween={16}
              slidesPerView={1.15}
              breakpoints={{
                640:  { slidesPerView: 2.2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              loop
              speed={700}
              autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              grabCursor
            >
              {wallets.map((w) => {
                const usd = Number(w.rate) > 0 ? Number(w.balance) / Number(w.rate) : 0;
                const isCrypto = w.currency_type === "CRYPTO";
                return (
                  <SwiperSlide key={w.currency_code} className="py-2!">
                    <div
                      className={`group relative select-none overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        isCrypto ? "hover:border-amber-500/40 hover:shadow-amber-500/10" : "hover:border-primary/40 hover:shadow-primary/10"
                      }`}
                    >
                      {/* decorative glow */}
                      <div
                        aria-hidden
                        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${
                          isCrypto ? "bg-amber-500/15" : "bg-primary/15"
                        } opacity-60`}
                      />

                      {/* header row */}
                      <div className="relative flex items-center gap-3">
                        <div className={`grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-surface ${isCrypto ? "ring-amber-500/20" : "ring-primary/20"}`}>
                          {flagUrl(w) ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote currency flag in a static-export app
                            <img src={flagUrl(w)} alt="" className="h-full w-full scale-150 object-cover" draggable={false} />
                          ) : (
                            <span className="grid h-full w-full place-items-center bg-primary/10 text-xs font-bold text-primary">{w.currency_symbol}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-heading">{w.name}</p>
                          <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isCrypto ? "bg-amber-500/12 text-amber-600 dark:text-amber-400" : "bg-primary/12 text-primary"
                          }`}>
                            {w.currency_type}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-lg bg-black/5 px-2 py-1 text-xs font-bold text-muted dark:bg-white/8">{w.currency_code}</span>
                      </div>

                      {/* balance */}
                      <div className="relative mt-4 flex items-baseline gap-1 font-mono tracking-tight tabular-nums">
                        <span className={`text-lg font-semibold ${isCrypto ? "text-amber-500/80" : "text-primary/80"}`}>{w.currency_symbol}</span>
                        <span className="text-2xl font-extrabold text-heading">{fmtMoney(w.balance)}</span>
                      </div>
                      <div className="relative mt-2 inline-flex items-center gap-1 rounded-md bg-black/5 px-1.5 py-0.5 text-[11px] font-medium text-muted dark:bg-white/5">
                        <span className="opacity-70">≈</span> ${fmtMoney(usd)} USD
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
      </section>

      {/* Escrow volume chart + overview */}
      <section className="grid gap-7.5 min-[1200px]:grid-cols-[1.6fr_1fr]">
        {/* Escrow volume (released escrow, month-to-date) */}
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h3 className="text-base font-bold tracking-tight text-heading">{t("dashboard.home.chartTitle")}</h3>
            <span className="rounded-md bg-black/5 px-2.5 py-1 text-xs font-semibold text-muted dark:bg-white/5">{t("dashboard.home.thisMonth")}</span>
          </div>
          <div className="p-4 sm:p-6">
            <LineChart series={escrowSeries} labels={chartDays} months={months} />
          </div>
        </div>

        {/* Escrow overview — progress bars */}
        <div className={PANEL}>
          <div className={PANEL_HEADER}>
            <h3 className="text-base font-bold tracking-tight text-heading">{t("dashboard.home.escrowOverview")}</h3>
          </div>
          <div className="flex flex-col gap-5 p-5 sm:p-8">
            {ESCROW_STATS.map((s) => (
              <div key={s.labelKey} className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted"><i className={`h-2 w-2 rounded-full ${s.dot}`} />{t(s.labelKey)}</span>
                  <span className="font-mono font-semibold tabular-nums text-heading">{s.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: s.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Money flow — full width */}
      <section className={PANEL}>
        <div className={PANEL_HEADER}>
          <h3 className="text-base font-bold tracking-tight text-heading">{t("dashboard.home.moneyFlow")}</h3>
          <ChartLegend
            items={[
              { label: t("dashboard.home.flowAdd"), color: FLOW_COLORS.add },
              { label: t("dashboard.home.flowOut"), color: FLOW_COLORS.out },
              { label: t("dashboard.home.flowExchange"), color: FLOW_COLORS.exchange },
            ]}
          />
        </div>
        <div className="p-4 sm:p-6">
          <LineChart series={flowSeries} labels={chartDays} months={months} />
        </div>
      </section>

      {/* Transactional records */}
      <section className={PANEL}>
        <div className={PANEL_HEADER}>
          <h3 className="text-base font-bold tracking-tight text-heading">{t("dashboard.home.txTitle")}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/transactions")}>
              {t("dashboard.home.viewAll")}
            </Button>
          </div>
        </div>
        {txns.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ArrowLeftRight size={20} strokeWidth={2} aria-hidden />
            </div>
            <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.home.noTxTitle")}</p>
            <p className="mt-1 text-xs text-muted">{t("dashboard.home.noTxDesc")}</p>
          </div>
        ) : (
          <div className="scroll-x">
            <table className="dash-table w-full min-w-210 border-collapse text-left">
              <thead>
                <tr className="border-b-0">
                  <th className={dsx.th}>{t("dashboard.transaction.colTransaction")}</th>
                  <th className={`${dsx.th} hidden sm:table-cell`}>{t("dashboard.transaction.colStatus")}</th>
                  <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.transaction.colTransactionId")}</th>
                  <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.transaction.colExchangeRate")}</th>
                  <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.transaction.colFees")}</th>
                  <th className={`${dsx.th} text-right`}>{t("dashboard.transaction.colAmount")}</th>
                  <th className={`${dsx.th} hidden whitespace-nowrap md:table-cell`}>{t("dashboard.transaction.colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((tx) => {
                  const meta = txMeta(tx.transaction_type);
                  const isExchange = /EXCHANGE/i.test(tx.transaction_type ?? "");
                  const sc = tx.sender_currency_code ?? "";
                  const target = tx.gateway_currency_code ?? tx.exchange_currency ?? sc;
                  const feeCur = tx.gateway_currency_code ?? sc;
                  const statusText = tx.string_status ?? (tx.status ? t("dashboard.status.success") : t("dashboard.status.pending"));
                  return (
                    <tr key={tx.trx_id ?? tx.id} className={dsx.rowHover}>
                      {/* transaction */}
                      <td className={dsx.td}>
                        <div className="flex items-center gap-3">
                          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.cls} [&>svg]:size-4.5`}>
                            <meta.Icon size={18} strokeWidth={2} aria-hidden />
                          </div>
                          <div>
                            {/* nowrap, not truncate — the table scrolls, so the label
                                should claim its width instead of being ellipsised */}
                            <div className="whitespace-nowrap text-sm font-semibold text-heading">
                              {t(meta.label)}{" "}
                              <span className="font-medium text-muted">
                                {isExchange && tx.exchange_currency
                                  ? `${sc} → ${tx.exchange_currency}`
                                  : tx.gateway_currency
                                  ? `${t("dashboard.transaction.via")} ${tx.gateway_currency}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* status */}
                      <td className={`${dsx.td} hidden whitespace-nowrap sm:table-cell`}>
                        <StatusBadge tone={statusTone(statusText)}>{statusText}</StatusBadge>
                      </td>
                      {/* trx id */}
                      <td className={`${dsx.td} hidden whitespace-nowrap font-mono text-sm text-muted md:table-cell`}>
                        {tx.trx_id}
                      </td>
                      {/* exchange rate */}
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-body lg:table-cell`}>
                        1 {sc} = {tx.exchange_rate} {target}
                      </td>
                      {/* fees */}
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-body lg:table-cell`}>
                        {fmtMoney(tx.fee)} {feeCur}
                      </td>
                      {/* amount */}
                      <td className={`${dsx.td} text-right`}>
                        <div className="whitespace-nowrap text-sm font-bold tabular-nums text-primary">
                          {fmtMoney(tx.sender_request_amount)} {sc}
                        </div>
                        <div className="mt-0.5 whitespace-nowrap text-xs tabular-nums text-muted">
                          {t("dashboard.transaction.payable")}: {fmtMoney(tx.total_payable)} {target}
                        </div>
                      </td>
                      {/* date */}
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-muted md:table-cell`}>
                        {fmtDate(tx.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
