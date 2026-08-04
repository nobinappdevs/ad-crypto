"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { EllipsisButton, Panel, PanelTitle } from "@/components/dashboard/ui";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { floor8, price, usd } from "@/config/market";
import { WALLETS, WALLETS_PREVIEW } from "@/config/wallets";
import { TRANSACTIONS, TRANSACTIONS_PREVIEW } from "@/config/transactions";
import { TransactionsChart } from "./TransactionsChart";
import { BuyCryptoChart } from "./BuyCryptoChart";
import { TransactionsTable } from "./TransactionsTable";

/* -------------------------------------------------------------------------- */
/* Demo data — wallets and the ledger are shared with the pages that own them  */
/* -------------------------------------------------------------------------- */

/** The overview shows the newest few rows; the Transactions page shows them all. */
const PREVIEW_ROWS = TRANSACTIONS.slice(0, TRANSACTIONS_PREVIEW);

/**
 * A holding, to as many places as that coin is quoted in, trailing zeros dropped.
 *
 * Floored, not rounded, and with the same `floor8` the trade pages use: rounding
 * 0.0221150869 up to 0.02211509 here would show a satoshi more on the dashboard
 * than Sell and Withdraw offer as "Available".
 */
const coin = (n: number, decimals: number) =>
  floor8(n).toLocaleString("en-US", { maximumFractionDigits: decimals });

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function DashboardHome() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  // Four cards, as in the reference design; "View more" opens the rest in place.
  const [allWallets, setAllWallets] = useState(false);
  const visibleWallets = allWallets ? WALLETS : WALLETS.slice(0, WALLETS_PREVIEW);

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
          hint={k("table.newestFew").replace("{count}", String(TRANSACTIONS_PREVIEW))}
          action={
            <>
              {/* The panel is a preview of the ledger, so it says where the rest is
                  rather than leaving the count unexplained. */}
              <Link
                href="/dashboard/transactions"
                className="inline-flex! h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-medium text-heading transition hover:border-primary hover:text-heading"
              >
                {k("viewAll")}
                <ArrowRight size={14} className="text-muted rtl:rotate-180" />
              </Link>
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

        <TransactionsTable rows={PREVIEW_ROWS} initialChecked={[0, 2, 3]} />
      </Panel>
    </div>
  );
}
