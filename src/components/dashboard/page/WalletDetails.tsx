"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Clock,
  Copy,
  HandCoins,
  Layers,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet as WalletIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { crypto, floor8, price, usd } from "@/config/market";
import { findWallet, type Wallet } from "@/config/wallets";
import {
  DEPOSIT_NETWORKS,
  depositAddress,
  depositMemo,
  depositUri,
  walletNetworks,
  type NetworkKey,
} from "@/config/deposit";
import { TRANSACTIONS, txAmount } from "@/config/transactions";

/** A holding, to as many places as its coin is quoted in. Floored, like the overview. */
const held = (n: number, decimals: number) =>
  floor8(n).toLocaleString("en-US", { maximumFractionDigits: decimals });

const STATUS_TONE: Record<string, string> = {
  processing: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  success: "bg-hero-mint/12 text-hero-mint",
  declined: "bg-hero-neg/12 text-hero-neg",
};

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One wallet, in detail: what it holds, and how to put more into it.
 *
 * The route is a single static page reading `?coin=`, NOT a `[coin]` segment — the
 * app is a static export, so a dynamic segment would need every wallet enumerated
 * at build time, which stops working the day the list comes from the API. Same
 * decision, and the same Suspense requirement, as `/web-journal/details`.
 *
 * ── The deposit flow ──
 * The source design listed the available networks as a read-only table underneath a
 * single QR code, which leaves the one question that matters unanswered: the
 * address DEPENDS on the network, and picking the wrong one destroys the deposit.
 * So the network list is the control here — choose a row and the QR, the address
 * and the tag all follow it — and each row carries what the choice actually costs:
 * how long it takes, how many confirmations, how small a transfer is allowed.
 */
export function WalletDetails() {
  const { t } = useLang();
  const k = (name: string) => t(`walletDetails.${name}`);

  const wallet = findWallet(useSearchParams().get("coin"));

  // One static page, so a missing or unknown `?coin=` is a state to land in
  // rather than an error — it gets a real message and a way back.
  if (!wallet) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        <Panel className="p-8 text-center sm:p-12">
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
        </Panel>
      </div>
    );
  }

  return <WalletPanels wallet={wallet} />;
}

/**
 * Split from the lookup above so the network state is keyed to a wallet that is
 * known to exist — otherwise every hook here would have to cope with `undefined`,
 * and switching wallets would carry the previous one's selected network over.
 */
function WalletPanels({ wallet }: { wallet: Wallet }) {
  const { t } = useLang();
  const k = (name: string) => t(`walletDetails.${name}`);

  const networks = walletNetworks(wallet.key);
  const [networkKey, setNetworkKey] = useState<NetworkKey>(networks[0]);
  const network = DEPOSIT_NETWORKS[networkKey];

  const [copied, setCopied] = useState<"address" | "memo" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const address = depositAddress(wallet.key, networkKey);
  const memo = network.memo ? depositMemo(wallet.key, networkKey) : null;

  /** The chain's floor, quoted in the coin rather than in dollars. */
  const minDeposit = crypto(floor8(network.minUsd / wallet.rate)) || "0";

  const activity = TRANSACTIONS.filter((tx) => tx.ticker === wallet.symbol);

  async function copy(value: string, which: "address" | "memo") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
    } catch {
      toast.error(k("copyFailed"));
    }
  }

  const actions = [
    { key: "buyCrypto", href: "/dashboard/buy-crypto", icon: ShoppingCart },
    { key: "sellCrypto", href: "/dashboard/sell-crypto", icon: HandCoins },
    { key: "withdrawCrypto", href: "/dashboard/withdraw-crypto", icon: ArrowDownToLine },
    { key: "exchangeCrypto", href: "/dashboard/exchange-crypto", icon: ArrowLeftRight },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={`${wallet.name} (${wallet.symbol})`}
        subtitle={k("subtitle").replace("{symbol}", wallet.symbol)}
        action={
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
            <CoinBadge color={wallet.color} glyph={wallet.glyph} size={28} />
            <span className="min-w-0">
              <span className="block text-[12px]! text-muted">{k("marketPrice")}</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[13px]! font-bold! tabular-nums">{price(wallet.rate)}</span>
                <span
                  className={cn(
                    "inline-flex! items-center gap-0.5 text-[11.5px]! font-semibold!",
                    wallet.up ? "text-hero-mint" : "text-hero-neg",
                  )}
                >
                  {wallet.up ? (
                    <TrendingUp size={11} aria-hidden />
                  ) : (
                    <TrendingDown size={11} aria-hidden />
                  )}
                  {wallet.change}
                </span>
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
                {k("receiveTitle").replace("{symbol}", wallet.symbol)}
              </h2>
              <p className="mt-1 text-[12.5px]! text-muted">{k("receiveHint")}</p>
            </div>
          </div>

          {/* Network choice — the reference design's "Available Network" table, made
              into the control it always implied. Radio rather than a dropdown: with
              three options at most, hiding them behind a click hides the trade-off
              between them, which is the whole reason to show arrival and fees. */}
          <fieldset className="mt-5">
            <legend className="mb-2 text-[13px] font-semibold text-heading">
              {k("chooseNetwork")}
            </legend>
            <div className="flex flex-col gap-2">
              {networks.map((key) => {
                const option = DEPOSIT_NETWORKS[key];
                const active = key === networkKey;
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 transition",
                      active
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="deposit-network"
                      value={key}
                      checked={active}
                      onChange={() => setNetworkKey(key)}
                      className="sr-only"
                    />
                    {/* Drawn, not a native radio: the native control cannot be given
                        the brand colour consistently across browsers. */}
                    <span
                      aria-hidden
                      className={cn(
                        "grid! h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition",
                        active ? "border-primary" : "border-border",
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full transition",
                          active ? "bg-primary" : "bg-transparent",
                        )}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-heading">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">
                        {k("networkMeta")
                          .replace("{minutes}", String(option.minutes))
                          .replace("{confirmations}", String(option.confirmations))}
                      </span>
                    </span>

                    <span className="shrink-0 text-end">
                      <span className="block text-[11px]! text-muted">{k("minDeposit")}</span>
                      <span className="block text-[12.5px]! font-semibold! tabular-nums">
                        {crypto(floor8(option.minUsd / wallet.rate)) || "0"} {wallet.symbol}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* QR — regenerated from the selected network's own URI */}
          <div className="mt-5 flex justify-center rounded-2xl border border-border bg-surface p-4 sm:p-6">
            {/* White plate regardless of theme: a QR inverted for a dark background
                is unreadable to a good half of scanners. */}
            <div className="rounded-xl bg-white p-3.5 shadow-[0_10px_30px_rgb(2_10_22/0.12)] sm:p-4">
              <QRCode
                value={depositUri(wallet.key, networkKey)}
                size={188}
                bgColor="#ffffff"
                fgColor="#091628"
                className="h-auto! w-full! max-w-47"
              />
            </div>
          </div>

          {/* Address */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[13px] font-semibold text-heading">{k("addressLabel")}</span>
              <span className="text-[11.5px]! text-muted">{network.label}</span>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
              {/* Read-only input, not a `<p>`: it stays selectable and keyboard
                  reachable, which is how the address gets copied wherever the
                  clipboard API is unavailable. `break-all` is not an option on an
                  input, so it scrolls instead of wrapping. */}
              <input
                readOnly
                value={address}
                aria-label={k("addressLabel")}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 cursor-default bg-transparent px-3.5 py-3.5 font-mono text-[12.5px] font-medium text-heading outline-none"
              />
              <button
                type="button"
                onClick={() => copy(address, "address")}
                aria-label={copied === "address" ? k("copied") : k("copyAddress")}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-1.5 border-s border-border px-4 text-[13px] font-semibold transition",
                  copied === "address"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-primary/10 hover:text-primary",
                )}
              >
                {copied === "address" ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : (
                  <Copy size={15} />
                )}
                <span className="hidden sm:inline">
                  {copied === "address" ? k("copied") : k("copy")}
                </span>
              </button>
            </div>
          </div>

          {/* Destination tag — only for chains that route everyone to one address */}
          {memo && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3.5">
              <div className="flex items-start gap-2.5">
                <TriangleAlert
                  size={15}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]! font-bold! text-amber-700 dark:text-amber-400">
                    {k("memoLabel")}
                  </p>
                  <p className="mt-0.5 text-[11.5px]! leading-relaxed! text-amber-700/90 dark:text-amber-400/90">
                    {k("memoWarning")}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex overflow-hidden rounded-lg border border-amber-500/30 bg-card">
                <input
                  readOnly
                  value={memo}
                  aria-label={k("memoLabel")}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 cursor-default bg-transparent px-3 py-2.5 font-mono text-[13px] font-bold tracking-wide text-heading outline-none"
                />
                <button
                  type="button"
                  onClick={() => copy(memo, "memo")}
                  aria-label={copied === "memo" ? k("copied") : k("copyMemo")}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center border-s border-amber-500/30 px-3.5 transition",
                    copied === "memo"
                      ? "text-primary"
                      : "text-muted hover:text-amber-700 dark:hover:text-amber-400",
                  )}
                >
                  {copied === "memo" ? (
                    <Check size={15} strokeWidth={2.5} />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* What the chosen route means, as figures rather than prose */}
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact icon={Clock} label={k("factArrival")}>
              {k("minutes").replace("{n}", String(network.minutes))}
            </Fact>
            <Fact icon={Layers} label={k("factConfirmations")}>
              {network.confirmations}
            </Fact>
            <Fact icon={ArrowDownToLine} label={k("factMin")}>
              {minDeposit} {wallet.symbol}
            </Fact>
          </dl>

          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-hero-neg/8 px-3.5 py-3 text-[12px]! leading-relaxed! text-hero-neg">
            <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
            {k("wrongNetwork")
              .replace("{symbol}", wallet.symbol)
              .replace("{network}", network.label)}
          </p>
        </Panel>

        {/* ------------------------- Rail ------------------------- */}
        <div className="grid grid-cols-1 gap-5 lg:col-span-5">
          {/* Holding */}
          <Panel className="overflow-hidden">
            <div
              className="p-4 sm:p-6"
              style={{
                background: `linear-gradient(150deg, ${wallet.color}22 0%, transparent 62%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <CoinBadge color={wallet.color} glyph={wallet.glyph} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-[14px]! font-bold!">{wallet.name}</p>
                  <p className="text-[12px]! text-muted">{k("holding")}</p>
                </div>
              </div>

              <div className="mt-4 text-[30px]! leading-none! font-bold! tracking-[-0.02em]">
                {held(wallet.balance, wallet.decimals)}{" "}
                <span className="inline! text-[20px]! font-bold! text-primary">
                  {wallet.symbol}
                </span>
              </div>
              <p className="mt-2 text-[13px]! text-muted">
                ≈ {usd(wallet.balance * wallet.rate)}
              </p>
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
                {activity.map((tx) => (
                  <li
                    key={tx.ref}
                    className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid! h-8 w-8 shrink-0 place-items-center rounded-lg",
                        tx.side === "buy"
                          ? "bg-primary/10 text-primary"
                          : "bg-hero-mint/12 text-hero-mint",
                      )}
                    >
                      {tx.side === "buy" ? (
                        <ShoppingCart size={14} />
                      ) : (
                        <HandCoins size={14} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-heading">
                        {t(`dashboard.tradeSide.${tx.side}`)} {crypto(tx.quantity)} {tx.ticker}
                      </span>
                      <span className="block text-[11.5px] text-muted">
                        {tx.date} · {tx.time}
                      </span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block text-[12.5px]! font-semibold! tabular-nums">
                        {usd(txAmount(tx))}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 inline-block! rounded-full px-2 py-0.5 text-[10.5px]! font-semibold!",
                          STATUS_TONE[tx.status],
                        )}
                      >
                        {t(`dashboard.status.${tx.status}`)}
                      </span>
                    </span>
                  </li>
                ))}
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

/** One figure from the chosen route, with its own icon so the row scans. */
function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px]! text-muted">
        <Icon size={12} aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 text-[13px]! font-bold! tabular-nums">{children}</dd>
    </div>
  );
}
