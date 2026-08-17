"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, IdCard, RotateCcw, TriangleAlert, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/components/ui/cn";
import { dsx, Panel, PanelTitle } from "@/components/dashboard/ui";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { DashboardHomeSkeleton } from "@/components/dashboard/Skeletons";
import { coinBrand, imageUrl } from "@/config/media";
import { num } from "@/config/txlog";
import { walletHref } from "@/config/wallets";
import type { DashboardWallet, ImagePaths } from "@/services/dashboard.service";
import { TransactionsChart } from "./TransactionsChart";
import { BuyCryptoChart } from "./BuyCryptoChart";
import { RecentTransactions } from "./RecentTransactions";

/** How many wallet cards show before "View more" opens the rest. */
const WALLETS_PREVIEW = 4;

/** A holding to at most 8 places, trailing zeros dropped. */
const balance = (value: string | number | undefined) =>
  num(value).toLocaleString("en-US", { maximumFractionDigits: 8 });

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
  const [allWallets, setAllWallets] = useState(false);

  const wallets = data?.wallets ?? [];
  const visibleWallets = allWallets ? wallets : wallets.slice(0, WALLETS_PREVIEW);
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
        {wallets.length > WALLETS_PREVIEW && (
          <button
            type="button"
            onClick={() => setAllWallets((v) => !v)}
            aria-expanded={allWallets}
            className="btn-lift inline-flex h-9 cursor-pointer items-center rounded-full bg-primary px-4 text-[12.5px] font-semibold text-white"
          >
            {k(allWallets ? "viewLess" : "viewMore")}
          </button>
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
/* Wallet card                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One holding: its coin, its balance, and its deposit address.
 *
 * The card is not a link, unlike the version this replaced. The address needs a
 * copy button, and a button inside a link is a control the user cannot reach
 * without also navigating — so the coin name carries the link and the address row
 * carries the copy.
 */
function WalletCard({ wallet, paths }: { wallet: DashboardWallet; paths: ImagePaths | undefined }) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const code = (wallet.currency?.code ?? "").toUpperCase();
  const brand = coinBrand(code);
  const flag = imageUrl(paths, wallet.currency?.flag);
  const address = wallet.public_address ?? "";

  const [copied, setCopied] = useState(false);
  const [flagBroken, setFlagBroken] = useState(false);

  // Cleared by effect rather than a bare setTimeout: four of these cards mount at
  // once, and a pending timer on one that unmounts (View more collapsing the row)
  // would still be holding a setState for a component that is gone.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      toast.error(k("copyFailed"));
    }
  }

  return (
    <div className={cn(dsx.card, "group flex flex-col transition-colors duration-200 hover:border-primary")}>
      <div className="flex items-start justify-between gap-2 px-4.5 pt-4">
        <Link
          href={walletHref(code.toLowerCase())}
          className="min-w-0 text-[12.5px]! text-muted transition-colors hover:text-primary!"
        >
          {wallet.currency?.name || code}
        </Link>

        {/* The API's own coin art, with the brand disc behind it as the fallback.
            A plain <img>, not next/image: images are unoptimized in this static
            export anyway, and the host comes from an env var — pinning it in
            next.config's remotePatterns would break the day the backend moves. */}
        {flag && !flagBroken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flag}
            alt=""
            width={34}
            height={34}
            loading="lazy"
            onError={() => setFlagBroken(true)}
            className="h-8.5 w-8.5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <CoinBadge color={brand.color} glyph={brand.glyph} size={34} />
        )}
      </div>

      <div className="px-4.5 pb-4">
        {/* The ticker rides the brand colour so the figure and its unit read as
            one value rather than two. */}
        <div className="text-[26px]! leading-none! font-bold! tracking-[-0.02em]">
          {balance(wallet.balance)} <span className="inline! font-bold! text-primary">{code}</span>
        </div>
      </div>

      {/* The deposit address, below a rule so it reads as a detail on the holding
          rather than a second competing figure. */}
      {address && (
        <div className="mt-auto flex items-center gap-2 border-t border-border px-4.5 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[11px]! text-muted">{k("depositAddress")}</span>
            <span className="block truncate font-mono text-[11.5px]! text-heading">{address}</span>
          </span>
          <button
            type="button"
            onClick={copyAddress}
            aria-label={copied ? k("copied") : k("copyAddress")}
            title={copied ? k("copied") : k("copyAddress")}
            className={cn(
              "grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg transition",
              copied ? "bg-primary/10 text-primary" : "text-muted hover:bg-primary/10 hover:text-primary",
            )}
          >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
          </button>
        </div>
      )}
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
