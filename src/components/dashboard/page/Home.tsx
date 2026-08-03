"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  Check,
  Download,
  Ellipsis,
  Minus,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { dsx, Panel } from "@/components/dashboard/ui";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { floor8 } from "@/config/market";
import { WALLETS, WALLETS_PREVIEW } from "@/config/wallets";
import { TransactionsChart } from "./TransactionsChart";
import { BuyCryptoChart } from "./BuyCryptoChart";

/* -------------------------------------------------------------------------- */
/* Demo data — the reference design's own numbers, US-formatted                 */
/* -------------------------------------------------------------------------- */

/** The wallet cards come from `@/config/wallets`, shared with the trade pages. */

const TRANSACTIONS = [
  {
    ref: "TXN-90418",
    ticker: "TSLA",
    company: "Tesla, Inc.",
    side: "buy",
    quantity: "124",
    price: "$242.11",
    amount: "$30,021.23",
    fee: "$30.02",
    date: "Dec 13, 2023",
    time: "09:41",
    status: "processing",
    email: "olivia@compani.com",
    avatar: "/assets/download/aveter.webp",
    initials: "OC",
  },
  {
    ref: "TXN-90417",
    ticker: "MTCH",
    company: "Match Group, Inc.",
    side: "sell",
    quantity: "275",
    price: "$36.53",
    amount: "$10,045.00",
    fee: "$10.05",
    date: "Dec 13, 2023",
    time: "11:07",
    status: "success",
    email: "phoenix@compani.com",
    avatar: "/assets/download/aveter-two.webp",
    initials: "PC",
  },
  {
    ref: "TXN-90411",
    ticker: "DDOG",
    company: "Datadog Inc",
    side: "buy",
    quantity: "331",
    price: "$121.24",
    amount: "$40,132.16",
    fee: "$40.13",
    date: "Dec 13, 2023",
    time: "15:22",
    status: "success",
    email: "lana@compani.com",
    avatar: null,
    initials: "LS",
  },
  {
    ref: "TXN-90404",
    ticker: "ARKG",
    company: "ARK Genomic Revolution ETF",
    side: "sell",
    quantity: "1,042",
    price: "$21.94",
    amount: "$22,865.12",
    fee: "$22.87",
    date: "Dec 28, 2023",
    time: "10:15",
    status: "declined",
    email: "demi@compani.com",
    avatar: null,
    initials: "DW",
  },
] as const;

/** Footer totals — recomputed here so the row can never drift from the data. */
const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (s: string) => Number(s.replace(/[$,]/g, ""));
const TOTAL_AMOUNT = usd(TRANSACTIONS.reduce((sum, r) => sum + num(r.amount), 0));
const TOTAL_FEE = usd(TRANSACTIONS.reduce((sum, r) => sum + num(r.fee), 0));

/**
 * A holding, to as many places as that coin is quoted in, trailing zeros dropped.
 *
 * Floored, not rounded, and with the same `floor8` the trade pages use: rounding
 * 0.0221150869 up to 0.02211509 here would show a satoshi more on the dashboard
 * than Sell and Withdraw offer as "Available".
 */
const coin = (n: number, decimals: number) =>
  floor8(n).toLocaleString("en-US", { maximumFractionDigits: decimals });

/** Sub-dollar prices need more than two places — at $0.16 a DOGE move vanishes. */
const price = (n: number) =>
  n >= 1
    ? usd(n)
    : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

/** Shared cell classes — numeric columns are end-aligned and tabular so the
    figures line up down the column and against the totals row. */
const TH = "px-4 py-3 text-start text-[12px]! font-semibold! text-muted";
const TH_NUM = "px-4 py-3 text-end text-[12px]! font-semibold! text-muted";
const TD_NUM = "border-b-0 px-4 py-4 text-end text-[13.5px]! tabular-nums";

/** Status text colours ride the theme tokens where one exists. */
const STATUS_CLASS: Record<string, string> = {
  processing: "text-amber-600 dark:text-amber-400",
  success: "text-hero-mint",
  declined: "text-hero-neg",
};

/* -------------------------------------------------------------------------- */
/* Small pieces                                                                */
/* -------------------------------------------------------------------------- */

function PanelTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
      <h2 className="text-[16px]! font-bold!">
        {children}
        {hint ? <span className="ml-1.5 text-[13px]! font-normal! text-muted">{hint}</span> : null}
      </h2>
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

  // Four cards, as in the reference design; "View more" opens the rest in place.
  const [allWallets, setAllWallets] = useState(false);
  const visibleWallets = allWallets ? WALLETS : WALLETS.slice(0, WALLETS_PREVIEW);

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
      {/* ---------------- Wallet cards ---------------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-[18px]! font-bold!">{k("myWallets")}</h2>
        {WALLETS.length > WALLETS_PREVIEW && (
          // Reveals the rest in place rather than pointing at a wallets page that
          // does not exist yet — a dead button is worse than no button.
          <button
            type="button"
            onClick={() => setAllWallets((v) => !v)}
            aria-expanded={allWallets}
            className="inline-flex h-9 cursor-pointer items-center rounded-full bg-primary px-4 text-[12.5px] font-semibold text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.3)] transition hover:opacity-90"
          >
            {k(allWallets ? "viewLess" : "viewMore")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleWallets.map((wallet) => (
          <Panel
            key={wallet.key}
            className="flex flex-col transition-colors duration-200 hover:border-primary"
          >
            <div className="flex items-start justify-between gap-2 px-4.5 pt-4">
              <span className="text-[12.5px]! text-muted">{wallet.name}</span>
              <CoinBadge color={wallet.color} glyph={wallet.glyph} size={34} />
            </div>
            <div className="px-4.5 pb-4">
              {/* The ticker rides the brand colour so the figure and its unit read
                  as one value rather than two. */}
              <div className="text-[26px]! leading-none! font-bold! tracking-[-0.02em]">
                {coin(wallet.balance, wallet.decimals)}{" "}
                <span className="inline! font-bold! text-primary">{wallet.symbol}</span>
              </div>
              <p className="mt-2 text-[12.5px]! text-muted">
                ≈ {usd(wallet.balance * wallet.rate)}
              </p>
            </div>
            {/* The 24h move sits below a rule so it reads as a footnote on the
                holding rather than a second, competing number. */}
            <div className="mt-auto flex items-center gap-2 border-t border-border px-4.5 py-3">
              <span className="text-[12.5px]! text-muted">{price(wallet.rate)}</span>
              <span
                className={cn(
                  "inline-flex! items-center gap-0.5 text-[12.5px]! font-semibold!",
                  wallet.up ? "text-hero-mint" : "text-hero-neg",
                )}
              >
                {wallet.up ? (
                  <TrendingUp size={12} aria-hidden />
                ) : (
                  <TrendingDown size={12} aria-hidden />
                )}
                {wallet.change}
              </span>
              <span className="text-[12.5px]! text-muted">{k("last24h")}</span>
            </div>
          </Panel>
        ))}
      </div>

      {/* ---------------- Buy chart + transactions overview ---------------- */}
      {/* 3/2 rather than an even split: the left chart carries twelve month groups
          of three bars, the right one twelve points. */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelTitle hint={k("last12Months")} action={<EllipsisButton />}>
            {k("transactionsOverview")}
          </PanelTitle>
          <TransactionsChart />
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelTitle hint={k("last12Months")} action={<EllipsisButton />}>
            {k("buyCryptoChart")}
          </PanelTitle>
          <BuyCryptoChart />
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
          <table className="min-w-290">
            <thead>
              <tr className="border-b border-border bg-transparent">
                <th className="w-12 py-3 pr-0 pl-5">
                  <CheckBox
                    state={headState}
                    label={k("table.selectAll")}
                    onClick={() =>
                      setChecked(
                        headState === "on" ? new Set() : new Set(TRANSACTIONS.map((_, i) => i)),
                      )
                    }
                  />
                </th>
                <th className={TH}>{k("table.productName")}</th>
                <th className={TH}>{k("table.type")}</th>
                <th className={TH_NUM}>{k("table.quantity")}</th>
                <th className={TH_NUM}>{k("table.price")}</th>
                <th className={TH_NUM}>{k("table.orderAmount")}</th>
                <th className={TH_NUM}>{k("table.fee")}</th>
                <th className={TH}>
                  <span className="inline-flex! items-center gap-1">
                    {k("table.date")}
                    <ArrowDown size={12} aria-hidden />
                  </span>
                </th>
                <th className={TH}>{k("table.status")}</th>
                <th className={TH}>{k("table.executedBy")}</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((row, i) => (
                <tr
                  key={row.ref}
                  className="border-b border-border transition-colors hover:bg-black/2 dark:hover:bg-white/3"
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
                  <td className="border-b-0 px-4 py-4">
                    {/* Direction is the one field a reader scans for, so it gets
                        a word as well as a colour — never colour alone. */}
                    <span
                      className={cn(
                        "inline-flex! items-center rounded-md px-2 py-0.5 text-[11.5px]! font-semibold! uppercase",
                        row.side === "buy"
                          ? "bg-hero-mint/12 text-hero-mint"
                          : "bg-hero-neg/12 text-hero-neg",
                      )}
                    >
                      {k(`tradeSide.${row.side}`)}
                    </span>
                  </td>
                  <td className={TD_NUM}>{row.quantity}</td>
                  <td className={TD_NUM}>{row.price}</td>
                  <td className={cn(TD_NUM, "font-semibold!")}>{row.amount}</td>
                  <td className={cn(TD_NUM, "text-muted")}>{row.fee}</td>
                  <td className="border-b-0 px-4 py-4">
                    <div className="text-[13px]!">{row.date}</div>
                    <div className="text-[12px]! tabular-nums text-muted">
                      {row.time} · {row.ref}
                    </div>
                  </td>
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
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface/60">
                <td className="py-3 pr-0 pl-5" />
                <td className="px-4 py-3 text-[12.5px]! font-semibold! text-muted" colSpan={4}>
                  {k("table.totalRow")}
                </td>
                <td className={cn(TD_NUM, "py-3 font-bold!")}>{TOTAL_AMOUNT}</td>
                <td className={cn(TD_NUM, "py-3 font-semibold!")}>{TOTAL_FEE}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3 text-[12.5px]! text-muted sm:px-5">
          {k("table.selectedCount")
            .replace("{selected}", String(checked.size))
            .replace("{total}", String(TRANSACTIONS.length))}
        </div>
      </Panel>
    </div>
  );
}
