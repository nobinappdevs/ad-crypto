"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  Calendar,
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Ellipsis,
  Minus,
  Percent,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { dsx, Panel } from "@/components/dashboard/ui";
import { AnalyticChart } from "./AnalyticChart";

/* -------------------------------------------------------------------------- */
/* Demo data — the reference design's own numbers, US-formatted                 */
/* -------------------------------------------------------------------------- */

const TABS = ["overview", "notifications", "tradeHistory"] as const;

const STATS = [
  {
    key: "income",
    value: "$348,261",
    change: "+12.95%",
    up: true,
    icon: DollarSign,
    tile: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "profit",
    value: "$15,708.98",
    change: "+8.12%",
    up: true,
    icon: CreditCard,
    tile: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    key: "revenue",
    value: "7,415,644",
    change: "-6.18%",
    up: false,
    icon: Coins,
    tile: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    key: "conversion",
    value: "10.87%",
    change: "+25.45%",
    up: true,
    icon: Percent,
    tile: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
] as const;

const COUNTRIES = [
  { key: "us", flag: "🇺🇸", share: 85 },
  { key: "jp", flag: "🇯🇵", share: 70 },
  { key: "id", flag: "🇮🇩", share: 45 },
  { key: "kr", flag: "🇰🇷", share: 38 },
] as const;

const TRANSACTIONS = [
  {
    ticker: "TSLA",
    company: "Tesla, Inc.",
    amount: "$30,021.23",
    date: "Dec 13, 2023",
    status: "processing",
    email: "olivia@compani.com",
    avatar: "/assets/download/aveter.webp",
    initials: "OC",
  },
  {
    ticker: "MTCH",
    company: "Match Group, Inc.",
    amount: "$10,045.00",
    date: "Dec 13, 2023",
    status: "success",
    email: "phoenix@compani.com",
    avatar: "/assets/download/aveter-two.webp",
    initials: "PC",
  },
  {
    ticker: "DDOG",
    company: "Datadog Inc",
    amount: "$40,132.16",
    date: "Dec 13, 2023",
    status: "success",
    email: "lana@compani.com",
    avatar: null,
    initials: "LS",
  },
  {
    ticker: "ARKG",
    company: "ARK Genomic Revolution ETF",
    amount: "$22,865.12",
    date: "Dec 28, 2023",
    status: "declined",
    email: "demi@compani.com",
    avatar: null,
    initials: "DW",
  },
] as const;

/** Status text colours ride the theme tokens where one exists. */
const STATUS_CLASS: Record<string, string> = {
  processing: "text-amber-600 dark:text-amber-400",
  success: "text-hero-mint",
  declined: "text-hero-neg",
};

/* -------------------------------------------------------------------------- */
/* Small pieces                                                                */
/* -------------------------------------------------------------------------- */

function PanelTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
      <h2 className="text-[16px]! font-bold!">{children}</h2>
      <div className="flex items-center gap-2">{action}</div>
    </div>
  );
}

/** Decorative "..." menu — every card and panel in the design carries one. */
function EllipsisButton() {
  return (
    <button
      type="button"
      className={cn(dsx.iconBtn, "h-8 w-8 cursor-pointer text-muted")}
      aria-hidden
      tabIndex={-1}
    >
      <Ellipsis size={16} />
    </button>
  );
}

function CheckBox({
  state,
  onClick,
  label,
}: {
  state: "on" | "off" | "mixed";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "mixed" ? "mixed" : state === "on"}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-4.5 w-4.5 cursor-pointer place-items-center rounded-[5px] border transition-colors",
        state === "off"
          ? "border-border bg-transparent hover:border-primary"
          : "border-primary bg-primary text-white",
      )}
    >
      {state === "on" && <Check size={12} strokeWidth={3} />}
      {state === "mixed" && <Minus size={12} strokeWidth={3} />}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function DashboardHome() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  // The other two tabs have no content of their own yet, so switching only
  // moves the underline — same as the rest of the design's dead-end controls.
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  // Rows 1, 3 and 4 arrive checked, exactly as in the reference design.
  const [checked, setChecked] = useState<Set<number>>(() => new Set([0, 2, 3]));

  const toggleRow = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const headState =
    checked.size === 0 ? "off" : checked.size === TRANSACTIONS.length ? "on" : "mixed";

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
      {/* ---------------- Tabs + range controls ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border">
        <div className="flex gap-6 overflow-x-auto">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={cn(
                "-mb-px cursor-pointer border-b-2 pb-3 text-[14px] font-semibold whitespace-nowrap transition-colors",
                tab === key
                  ? "border-primary text-heading"
                  : "border-transparent text-muted hover:text-heading",
              )}
            >
              {k(`tabs.${key}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pb-2.5">
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12.5px] font-medium text-heading transition hover:border-primary"
          >
            <Calendar size={14} className="text-muted" />
            28 Aug - 15 Dec, 2024
          </button>
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12.5px] font-medium text-heading transition hover:border-primary"
          >
            <SlidersHorizontal size={14} className="text-muted" />
            {k("filter")}
          </button>
          <button
            type="button"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 text-[12.5px] font-semibold text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.3)] transition hover:opacity-90"
          >
            <Share2 size={14} />
            {k("share")}
          </button>
        </div>
      </div>

      {/* ---------------- Stat cards ---------------- */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map(({ key, value, change, up, icon: Icon, tile }) => (
          <Panel
            key={key}
            className="cursor-pointer p-4.5 transition-colors duration-200 hover:border-primary"
          >
            <div className="flex items-start justify-between">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tile)}>
                <Icon size={18} />
              </span>
              <EllipsisButton />
            </div>
            <div className="mt-4 text-[13px]! text-muted">{k(`stats.${key}`)}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[24px]! leading-none! font-bold! tracking-[-0.02em]">
                {value}
              </span>
              <span
                className={cn(
                  "inline-flex! items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px]! font-semibold!",
                  up ? "bg-hero-mint/12 text-hero-mint" : "bg-hero-neg/12 text-hero-neg",
                )}
              >
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {change}
              </span>
            </div>
            <div className="mt-2 text-[12px]! text-muted">{k("comparedToLastMonth")}</div>
          </Panel>
        ))}
      </div>

      {/* ---------------- Analytic + Session by Country ---------------- */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelTitle
            action={
              <>
                <button
                  type="button"
                  className="inline-flex h-8.5 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-[12.5px] font-medium text-heading transition hover:border-primary"
                >
                  {k("salesEstimation")}
                  <ChevronDown size={13} className="text-muted" />
                </button>
                <EllipsisButton />
              </>
            }
          >
            {k("analytic")}
          </PanelTitle>
          <AnalyticChart />
        </Panel>

        <Panel>
          <PanelTitle action={<EllipsisButton />}>{k("sessionByCountry")}</PanelTitle>
          <div className="flex flex-col gap-5 px-4 pt-1 pb-5 sm:px-5">
            {COUNTRIES.map(({ key, flag, share }) => (
              <div key={key} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid! h-9.5 w-9.5 shrink-0 place-items-center rounded-full bg-surface text-[17px]! ring-1 ring-border"
                >
                  {flag}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-[13px]! font-medium! text-muted">
                      {k(`countries.${key}`)}
                    </span>
                    <span className="text-[13px]! font-bold!">{share}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/6 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ---------------- Transaction History ---------------- */}
      <Panel className="mt-5">
        <PanelTitle
          action={
            <>
              <button
                type="button"
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-[12.5px] font-medium text-heading transition hover:border-primary"
              >
                <Download size={14} className="text-muted" />
                <span className="hidden sm:inline">{k("download")}</span>
              </button>
              <button
                type="button"
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 text-[12.5px] font-semibold text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.3)] transition hover:opacity-90"
              >
                <RotateCcw size={14} />
                {k("reIssue")}
              </button>
            </>
          }
        >
          {k("transactionHistory")}
        </PanelTitle>

        {/* min-w keeps the columns honest; below that the panel scrolls
            sideways instead of crushing the table. */}
        <div className="overflow-x-auto">
          <table className="min-w-190">
            <thead>
              <tr className="border-b border-border bg-transparent">
                <th className="w-12 py-3 pr-0 pl-5">
                  <CheckBox
                    state={headState}
                    label={k("table.productName")}
                    onClick={() =>
                      setChecked(
                        headState === "on" ? new Set() : new Set(TRANSACTIONS.map((_, i) => i)),
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3 text-[12px]! font-semibold! text-muted">
                  {k("table.productName")}
                </th>
                <th className="px-4 py-3 text-[12px]! font-semibold! text-muted">
                  {k("table.orderAmount")}
                </th>
                <th className="px-4 py-3 text-[12px]! font-semibold! text-muted">
                  <span className="inline-flex! items-center gap-1">
                    {k("table.date")}
                    <ArrowDown size={12} aria-hidden />
                  </span>
                </th>
                <th className="px-4 py-3 text-[12px]! font-semibold! text-muted">
                  {k("table.status")}
                </th>
                <th className="px-4 py-3 text-[12px]! font-semibold! text-muted">
                  {k("table.executedBy")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((row, i) => (
                <tr
                  key={row.ticker}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-black/2 dark:hover:bg-white/3"
                >
                  <td className="w-12 border-b-0 py-4 pr-0 pl-5">
                    <CheckBox
                      state={checked.has(i) ? "on" : "off"}
                      label={row.ticker}
                      onClick={() => toggleRow(i)}
                    />
                  </td>
                  <td className="border-b-0 px-4 py-4">
                    <div className="text-[13.5px]! font-bold!">{row.ticker}</div>
                    <div className="text-[12px]! text-muted">{row.company}</div>
                  </td>
                  <td className="border-b-0 px-4 py-4 text-[13.5px]! font-medium!">{row.amount}</td>
                  <td className="border-b-0 px-4 py-4 text-[13px]! text-muted">{row.date}</td>
                  <td className="border-b-0 px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex! items-center gap-1.5 text-[12.5px]! font-semibold!",
                        STATUS_CLASS[row.status],
                      )}
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                      {k(`status.${row.status}`)}
                    </span>
                  </td>
                  <td className="border-b-0 px-4 py-4">
                    <span className="inline-flex! items-center gap-2.5">
                      {row.avatar ? (
                        <Image
                          src={row.avatar}
                          alt=""
                          width={700}
                          height={966}
                          className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
                        />
                      ) : (
                        <span className="grid! h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px]! font-bold! text-primary">
                          {row.initials}
                        </span>
                      )}
                      <span className="text-[13px]! text-muted">{row.email}</span>
                    </span>
                  </td>
                  <td className="border-b-0 px-4 py-4 text-right">
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-heading transition hover:border-primary"
                    >
                      {k("table.more")}
                      <ChevronDown size={13} className="text-muted" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
