"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import {
  ArrowDownToLine,
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  HandCoins,
  QrCode,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
  Wallet as WalletIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { useDashboard } from "@/hooks/useDashboard";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { WalletSkeleton } from "@/components/dashboard/Skeletons";
import { coinBrand, imageUrl } from "@/config/media";
import {
  TX_DIRECTION,
  TX_STATUS_CLASS,
  coinAmount,
  txCoin,
  txDateTime,
  txStatusKey,
  txTypeKey,
} from "@/config/txlog";
import type {
  DashboardTransaction,
  DashboardWallet,
  ImagePaths,
} from "@/services/dashboard.service";

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One wallet in detail: what it holds, where to send more, and over which chains.
 *
 * A static page reading `?coin=`, not a `[coin]` segment — a static export would
 * have to enumerate every wallet at build time. Its data is already in the
 * `/user/dashboard` cache, so it usually paints without a request.
 *
 * The API issues ONE address per wallet and lists the networks it can be reached
 * over, so the network list is a table, not a control — the choice is made in the
 * sending app.
 */
export function WalletDetails() {
  const { t } = useLang();
  const k = (name: string) => t(`walletDetails.${name}`);

  const param = (useSearchParams().get("coin") ?? "").trim().toLowerCase();
  const { data, isPending, isError, error, refetch } = useDashboard();

  const wallets = data?.wallets ?? [];
  /** Ticker first (what the overview links with), but an id or address resolves too. */
  const wallet =
    wallets.find((w) => (w.currency?.code ?? "").toLowerCase() === param) ??
    wallets.find((w) => String(w.id) === param || (w.public_address ?? "").toLowerCase() === param);

  if (isPending) return <WalletSkeleton />;

  if (isError) {
    return (
      <Shell>
        <span
          aria-hidden
          className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
        >
          <TriangleAlert size={20} />
        </span>
        <h1 className="mt-4 text-[18px]! font-bold!">{k("loadFailed")}</h1>
        <p className="mx-auto mt-2 max-w-100 text-[13px]! leading-relaxed! text-muted">
          {getApiErrorMessage(error)}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn-lift mt-6 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13.5px] font-bold text-white"
        >
          <RotateCcw size={15} aria-hidden />
          {k("retry")}
        </button>
      </Shell>
    );
  }

  // One static page, so a missing or unknown `?coin=` is a state to land in
  // rather than an error — it gets a real message and a way back.
  if (!wallet) {
    return (
      <Shell>
        <span
          aria-hidden
          className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
        >
          <WalletIcon size={20} />
        </span>
        <h1 className="mt-4 text-[18px]! font-bold!">{k("notFoundTitle")}</h1>
        <p className="mx-auto mt-2 max-w-100 text-[13px]! leading-relaxed! text-muted">
          {k("notFoundText")}
        </p>
        <Link
          href="/dashboard"
          className="btn-lift mt-6 inline-flex! h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[13.5px] font-bold text-white!"
        >
          <ArrowLeft size={15} aria-hidden className="rtl:rotate-180" />
          {k("backToOverview")}
        </Link>
      </Shell>
    );
  }

  return (
    <WalletPanels
      wallet={wallet}
      paths={data?.currency_image_paths}
      transactions={data?.recent_transactions ?? []}
    />
  );
}

/** The centred single-panel frame the empty and failed states share. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <Panel className="mx-auto max-w-[560px] p-8 text-center sm:p-12">{children}</Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The wallet                                                                  */
/* -------------------------------------------------------------------------- */

/** Split from the lookup, so everything here is keyed to a wallet known to exist. */
function WalletPanels({
  wallet,
  paths,
  transactions,
}: {
  wallet: DashboardWallet;
  paths: ImagePaths | undefined;
  transactions: DashboardTransaction[];
}) {
  const { t, lang } = useLang();
  const k = (name: string) => t(`walletDetails.${name}`);

  const code = (wallet.currency?.code ?? "").toUpperCase();
  const name = wallet.currency?.name || code;
  const brand = coinBrand(code);
  const flag = imageUrl(paths, wallet.currency?.flag);
  const address = wallet.public_address ?? "";
  const networks = wallet.currency?.networks ?? [];

  const [copied, setCopied] = useState(false);
  const [flagBroken, setFlagBroken] = useState(false);

  // Cleared by effect rather than a bare setTimeout, so a pending timer is not
  // left holding a setState for a component that has unmounted.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      toast.error(k("copyFailed"));
    }
  }

  /** This wallet's slice of the ledger, by the coin each row is denominated in. */
  const activity = transactions.filter((tx) => txCoin(tx).code === code);

  const actions = [
    { key: "buyCrypto", href: "/dashboard/buy-crypto", icon: ShoppingCart },
    { key: "sellCrypto", href: "/dashboard/sell-crypto", icon: HandCoins },
    { key: "withdrawCrypto", href: "/dashboard/withdraw-crypto", icon: ArrowDownToLine },
    { key: "exchangeCrypto", href: "/dashboard/exchange-crypto", icon: ArrowLeftRight },
  ] as const;

  /** The API's coin art, with the brand disc behind it as the fallback. */
  const mark = (size: number) =>
    flag && !flagBroken ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={flag}
        alt=""
        width={size}
        height={size}
        onError={() => setFlagBroken(true)}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    ) : (
      <CoinBadge color={brand.color} glyph={brand.glyph} size={size} />
    );

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={`${name} (${code})`}
        subtitle={k("subtitle").replace("{symbol}", code)}
        action={
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
            {mark(28)}
            <span className="min-w-0">
              <span className="block text-[12px]! text-muted">{k("holding")}</span>
              <span className="block text-[13px]! font-bold! tabular-nums">
                {coinAmount(wallet.balance)} {code}
              </span>
            </span>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Receive ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid! h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"
            >
              <QrCode size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[16px]! leading-tight! font-bold!">
                {k("receiveTitle").replace("{symbol}", code)}
              </h2>
              <p className="mt-1 text-[12.5px]! text-muted">{k("receiveHint")}</p>
            </div>
          </div>

          {address ? (
            <>
              <div className="mt-5 flex justify-center rounded-2xl border border-border bg-surface p-4 sm:p-6">
                {/* White plate regardless of theme: a QR inverted for a dark
                    background is unreadable to a good half of scanners. */}
                <div className="rounded-xl bg-white p-3.5 shadow-[0_10px_30px_rgb(2_10_22/0.12)] sm:p-4">
                  <QRCode
                    value={address}
                    size={188}
                    bgColor="#ffffff"
                    fgColor="#091628"
                    className="h-auto! w-full! max-w-47"
                  />
                </div>
              </div>

              <div className="mt-5">
                <span className="mb-2 block text-[13px] font-semibold text-heading">
                  {k("addressLabel")}
                </span>
                <div className="flex overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
                  {/* Read-only input, not a `<p>`: it stays selectable and keyboard
                      reachable, which is how the address gets copied wherever the
                      clipboard API is unavailable. */}
                  <input
                    readOnly
                    value={address}
                    aria-label={k("addressLabel")}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 cursor-default bg-transparent px-3.5 py-3.5 font-mono text-[12.5px] font-medium text-heading outline-none"
                  />
                  <button
                    type="button"
                    onClick={copy}
                    aria-label={copied ? k("copied") : k("copyAddress")}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-1.5 border-s border-border px-4 text-[13px] font-semibold transition",
                      copied
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-primary/10 hover:text-primary",
                    )}
                  >
                    {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} />}
                    <span className="hidden sm:inline">{copied ? k("copied") : k("copy")}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-5 rounded-xl bg-surface px-3.5 py-6 text-center text-[12.5px]! text-muted">
              {k("noAddress")}
            </p>
          )}

          {/* Available networks. A table, not a picker: the address is the same
              whichever chain the sender uses, so these rows inform the choice
              made in THEIR app — what it costs, and how long it takes. */}
          {networks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[13px]! font-semibold!">{k("networksTitle")}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {networks.map((entry, i) => (
                  <li
                    key={entry.id ?? i}
                    className="rounded-xl border border-border bg-surface px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-[13.5px] font-semibold text-heading">
                        {entry.network?.name || "—"}
                      </span>
                      <span className="flex items-center gap-3 text-[12px]! text-muted">
                        {entry.network?.arrival_time != null && (
                          <span className="inline-flex! items-center gap-1">
                            <Clock size={12} aria-hidden />
                            {k("minutes").replace("{n}", String(entry.network.arrival_time))}
                          </span>
                        )}
                        <span className="tabular-nums">
                          {k("networkFee")}: {coinAmount(entry.fees)} {code}
                        </span>
                      </span>
                    </div>
                    {entry.network?.description && (
                      <p className="mt-1 text-[11.5px]! leading-relaxed! text-muted">
                        {entry.network.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-hero-neg/8 px-3.5 py-3 text-[12px]! leading-relaxed! text-hero-neg">
            <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
            {k("warning").replace("{symbol}", code)}
          </p>
        </Panel>

        {/* ------------------------- Rail ------------------------- */}
        <div className="grid grid-cols-1 gap-5 lg:col-span-5">
          {/* Holding */}
          <Panel className="overflow-hidden">
            <div
              className="p-4 sm:p-6"
              style={{ background: `linear-gradient(150deg, ${brand.color}22 0%, transparent 62%)` }}
            >
              <div className="flex items-center gap-3">
                {mark(44)}
                <div className="min-w-0">
                  <p className="truncate text-[14px]! font-bold!">{name}</p>
                  <p className="text-[12px]! text-muted">{k("holding")}</p>
                </div>
              </div>

              <div className="mt-4 text-[30px]! leading-none! font-bold! tracking-[-0.02em]">
                {coinAmount(wallet.balance)}{" "}
                <span className="inline! text-[20px]! font-bold! text-primary">{code}</span>
              </div>
            </div>

            {/* Every verb that applies to a holding, in one row — this page is where
                you land from the overview card, so it has to be a junction and not a
                dead end. */}
            <div className="grid grid-cols-4 border-t border-border">
              {actions.map(({ key, href, icon: Icon }, index) => (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "flex! flex-col items-center gap-1.5 px-1 py-3.5 text-center transition hover:bg-primary/6",
                    index > 0 && "border-s border-border",
                  )}
                >
                  <Icon size={16} aria-hidden className="text-primary" />
                  <span className="text-[11px]! leading-tight! font-semibold! text-heading">
                    {t(`dashboard.nav.${key}`)}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          {/* This wallet's own slice of the ledger */}
          <Panel className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px]! font-bold!">{k("activityTitle")}</h2>
              <Link
                href="/dashboard/transactions"
                className="text-[12.5px]! font-semibold! text-primary hover:underline"
              >
                {t("dashboard.viewAll")}
              </Link>
            </div>

            {activity.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface px-3.5 py-6 text-center text-[12.5px]! text-muted">
                {k("activityEmpty")}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {activity.map((tx, i) => {
                  const typeKey = txTypeKey(tx.type);
                  const direction = typeKey ? TX_DIRECTION[typeKey] : "neutral";
                  const statusKey = txStatusKey(tx.status);
                  const { date, time } = txDateTime(tx.created_at, lang);

                  return (
                    <li
                      key={tx.trx_id || tx.id || i}
                      className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid! h-8 w-8 shrink-0 place-items-center rounded-lg",
                          direction === "in"
                            ? "bg-hero-mint/12 text-hero-mint"
                            : direction === "out"
                              ? "bg-hero-neg/12 text-hero-neg"
                              : "bg-primary/10 text-primary",
                        )}
                      >
                        {direction === "in" ? (
                          <ArrowDownLeft size={14} />
                        ) : direction === "out" ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowLeftRight size={14} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-heading">
                          {typeKey ? t(`dashboard.txType.${typeKey}`) : tx.type || "—"}{" "}
                          {coinAmount(tx.amount)} {code}
                        </span>
                        <span className="block truncate text-[11.5px] text-muted">
                          {[date, time, tx.trx_id].filter(Boolean).join(" · ")}
                        </span>
                      </span>

                      <span className="shrink-0 text-end">
                        <span className="block text-[12.5px]! font-semibold! tabular-nums">
                          {coinAmount(tx.total_payable)} {code}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex! items-center gap-1 text-[11px]! font-semibold!",
                            TX_STATUS_CLASS[statusKey],
                          )}
                        >
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                          {t(`dashboard.txStatus.${statusKey}`)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <p className="flex items-start gap-2 px-1 text-[11.5px]! leading-relaxed! text-muted">
            <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-hero-mint" />
            {k("secured")}
          </p>
        </div>
      </div>
    </div>
  );
}
