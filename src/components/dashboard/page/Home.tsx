"use client";

import Link from "next/link";
import { ArrowRight, IdCard, RotateCcw, TriangleAlert, Wallet } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/components/ui/cn";
import { Panel, PanelTitle } from "@/components/dashboard/ui";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { DashboardHomeSkeleton } from "@/components/dashboard/Skeletons";
import { TransactionsChart } from "./TransactionsChart";
import { BuyCryptoChart } from "./BuyCryptoChart";
import { RecentTransactions } from "./RecentTransactions";

/**
 * How many wallet cards the overview shows. The rest are a click away on
 * `/dashboard/wallets` rather than expanded in place: this page is a summary with
 * two charts and a ledger under it, and an account holding a dozen coins would
 * push all of that below the fold to say something the wallets page says better.
 */
const WALLETS_PREVIEW = 4;

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The dashboard overview, entirely from `GET /user/dashboard`: what the account
 * holds, a year of activity, and the newest transactions.
 *
 * Worth knowing what this page deliberately does NOT show. The wallet cards used
 * to carry a fiat value, a unit price and a 24h move; the endpoint sends none of
 * those, and there is no market-data endpoint in this API. Rather than price
 * balances from a hard-coded table — which would put a wrong dollar figure under a
 * real holding — each card shows its deposit address instead, which is both true
 * and the thing a user actually comes to a wallet card for.
 */
export function DashboardHome() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const { data, isPending, isError, error, refetch } = useDashboard();

  const wallets = data?.wallets ?? [];
  const visibleWallets = wallets.slice(0, WALLETS_PREVIEW);
  const transactions = data?.recent_transactions ?? [];
  const chart = data?.chart;

  if (isPending) return <DashboardHomeSkeleton />;

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
        <Panel className="p-6 text-center">
          <span
            aria-hidden
            className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
          >
            <TriangleAlert size={20} />
          </span>
          <h2 className="mt-4 text-[16px]! font-bold!">{k("loadFailed")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {getApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
          >
            <RotateCcw size={15} aria-hidden />
            {k("retry")}
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
      {/* KYC prompt — the payload says whether the account is verified, and an
          unverified one hits a wall at the first withdrawal. Better to say so
          here than to let them find out mid-transaction. */}
      {data?.kyc_verified !== 1 && <KycNotice status={data?.kyc_verified} />}

      {/* ---------------- Wallet cards ---------------- */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-[18px]! font-bold!">{k("myWallets")}</h2>
        {/* A link to the wallets page, not the in-place expander this replaces.
            Expanding pushed the charts and the ledger off the screen to show cards
            that have a page of their own, and it was hidden below five wallets —
            so an account with exactly four had no way to reach that page at all. */}
        {wallets.length > 0 && (
          <Link
            href="/dashboard/wallets"
            className="btn-lift inline-flex! h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[12.5px] font-semibold text-white!"
          >
            {k("allWallets")}
            <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
          </Link>
        )}
      </div>

      {wallets.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-14 text-center">
          <span
            aria-hidden
            className="grid! h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
          >
            <Wallet size={20} />
          </span>
          <p className="mt-4 text-[14px]! font-bold!">{k("noWalletsTitle")}</p>
          <p className="mt-1 max-w-90 text-[12.5px]! leading-relaxed! text-muted">
            {k("noWalletsDesc")}
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleWallets.map((wallet, i) => (
            <WalletCard
              key={wallet.id ?? i}
              wallet={wallet}
              paths={data?.currency_image_paths}
            />
          ))}
        </div>
      )}

      {/* ---------------- Activity charts ---------------- */}
      {/* 3/2 rather than an even split: the left chart carries twelve month groups
          of three bars, the right one twelve points. */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelTitle hint={k("chartCountHint")}>{k("transactionsOverview")}</PanelTitle>
          <TransactionsChart
            labels={chart?.labels}
            buy={chart?.buy_data}
            sell={chart?.sell_data}
            withdraw={chart?.withdraw_data}
          />
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelTitle hint={k("chartCountHint")}>{k("buyCryptoChart")}</PanelTitle>
          <BuyCryptoChart labels={chart?.labels} buy={chart?.buy_data} />
        </Panel>
      </div>

      {/* ---------------- Recent transactions ---------------- */}
      <Panel className="mt-5">
        <PanelTitle
          hint={
            transactions.length
              ? k("table.newestFew").replace("{count}", String(transactions.length))
              : undefined
          }
          action={
            <Link
              href="/dashboard/transactions"
              className="inline-flex! h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-medium text-heading transition hover:border-primary"
            >
              {k("viewAll")}
              <ArrowRight size={14} className="text-muted rtl:rotate-180" />
            </Link>
          }
        >
          {k("transactionHistory")}
        </PanelTitle>

        <RecentTransactions rows={transactions} />
      </Panel>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* KYC notice                                                                  */
/* -------------------------------------------------------------------------- */

/** 0 unverified, 2 pending, 3 rejected — 1 never reaches here. */
function KycNotice({ status }: { status: number | undefined }) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.kycNotice.${name}`);

  const state = status === 2 ? "pending" : status === 3 ? "rejected" : "unverified";
  const pending = state === "pending";

  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4",
        pending ? "border-primary/25 bg-primary/6" : "border-amber-500/25 bg-amber-500/8",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid! h-10 w-10 shrink-0 place-items-center rounded-xl",
          pending ? "bg-primary/12 text-primary" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        )}
      >
        <IdCard size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px]! font-bold!">{k(`${state}.title`)}</p>
        <p className="mt-0.5 text-[12.5px]! leading-relaxed! text-muted">{k(`${state}.desc`)}</p>
      </div>

      {/* Pending has nothing to act on — a reviewer holds it, and a button that
          re-opens the form would only invite a duplicate submission. */}
      {!pending && (
        <Link
          href="/dashboard/kyc"
          className="btn-lift inline-flex! h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-bold text-white!"
        >
          {k("cta")}
          <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}
