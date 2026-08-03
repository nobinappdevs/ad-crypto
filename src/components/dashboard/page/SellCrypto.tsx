"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpFromLine,
  Clock,
  Copy,
  Lock,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { AmountField, FieldLabel, Row } from "@/components/dashboard/TradeFields";
import {
  COINS,
  NETWORKS,
  PAY_SYMBOL,
  PERCENTS,
  crypto,
  fiat,
  floor8,
  toNumber,
} from "@/config/market";

/* -------------------------------------------------------------------------- */
/* Sell-side options                                                           */
/* -------------------------------------------------------------------------- */

const METHODS = ["adout", "bank", "balance"] as const;
/** Payout surcharge as a fraction of the order — bank rails cost the most. */
const METHOD_SURCHARGE: Record<string, number> = { adout: 0, bank: 0.01, balance: 0 };

/**
 * The settlement side of the pair is only ever shown to two decimals — but a bare
 * `fiat()` would stamp "0.00" into the field the moment the crypto side is empty,
 * and then fight the user's next keystroke.
 */
const fiatInput = (n: number) => (n === 0 ? "" : fiat(n));

/**
 * Where an "Outside Wallet" order sends its coins. A real order gets a freshly
 * derived address per network from the API; this is a placeholder of the right
 * shape so the panel can be laid out and read.
 */
const DEPOSIT_ADDRESS: Record<string, string> = {
  trc20: "TQ5NMqJjWcs3sBBpP7uZ2rWk4tGrfKcPVn",
  ripple: "rn5xVsgS2FzcYaLmqA1KL9pcnJ2mQaVdEo",
  bep20: "0x7d24f4bA3fD1A6cB3B0f9cE21bE2f0aD41Bc8917",
  erc20: "0x41cE9a8Db7fE0bC5D2a4E7A0fF3cB16d5aE9207c",
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function SellCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`sellCrypto.${name}`);

  const [source, setSource] = useState<"inside" | "outside">("inside");
  const [coinKey, setCoinKey] = useState<string>(COINS[0].key);
  const [networkKey, setNetworkKey] = useState<string>(NETWORKS[0].key);
  const [method, setMethod] = useState<string>(METHODS[0]);
  const [touched, setTouched] = useState(false);

  // One side is the raw input, the other is derived from it. Tracking WHICH was
  // last typed in is what keeps a half-typed "0.0" from being rewritten into
  // "0" by its own round-trip through the exchange rate.
  const [side, setSide] = useState<"sell" | "get">("sell");
  const [sellRaw, setSellRaw] = useState("");
  const [getRaw, setGetRaw] = useState("");

  const coin = COINS.find((c) => c.key === coinKey) ?? COINS[0];
  const network = NETWORKS.find((n) => n.key === networkKey) ?? NETWORKS[0];

  /**
   * Selling out of the AdCrypto balance can never exceed that balance; coins sent
   * in from outside are bounded only by the order limit. This is also what the
   * percentage chips divide, so "50%" means half of whatever is actually sellable.
   */
  const sellable = floor8(source === "inside" ? Math.min(coin.balance, coin.max) : coin.max);

  const sellValue = side === "sell" ? sellRaw : crypto(toNumber(getRaw) / coin.rate);
  const getValue = side === "get" ? getRaw : fiatInput(toNumber(sellRaw) * coin.rate);

  const sellNum = toNumber(sellValue);
  const grossNum = sellNum * coin.rate;

  const surcharge = grossNum * (METHOD_SURCHARGE[method] ?? 0);
  // Fees come OUT of a sell — the payout is what is left after the rails take
  // their cut, floored so a dust-sized order never shows a negative total.
  const payout = Math.max(0, grossNum - surcharge - network.fee);

  const error = useMemo(() => {
    if (!touched) return null;
    if (sellNum <= 0) return k("errorAmount");
    if (sellNum < coin.min)
      return k("errorMin").replace("{min}", crypto(coin.min)).replace("{coin}", coin.symbol);
    if (sellNum > coin.max)
      return k("errorMax").replace("{max}", crypto(coin.max)).replace("{coin}", coin.symbol);
    if (source === "inside" && sellNum > coin.balance)
      return k("errorBalance")
        .replace("{balance}", crypto(coin.balance))
        .replace("{coin}", coin.symbol);
    return null;
  }, [touched, sellNum, coin, source]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPercent = (pct: number) => {
    setSide("sell");
    setSellRaw(crypto(floor8((sellable * pct) / 100)));
  };

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(DEPOSIT_ADDRESS[network.key] ?? "");
      toast.success(k("copied"));
      return;
    } catch {}
    toast.error(k("copyFailed"));
  }

  function submit() {
    setTouched(true);
    // `error` is memoised against the pre-click state, so re-check the conditions
    // a first-time click can trip.
    if (sellNum <= 0 || sellNum < coin.min || sellNum > coin.max) return;
    if (source === "inside" && sellNum > coin.balance) return;
    toast.success(k("submitted").replace("{amount}", `${crypto(sellNum)} ${coin.symbol}`));
  }

  const coinOptions: SelectOption[] = COINS.map((c) => ({
    value: c.key,
    label: c.symbol,
    hint: c.name,
    meta: `$${fiat(c.rate)}`,
    icon: <CoinBadge color={c.color} glyph={c.glyph} />,
  }));

  const networkOptions: SelectOption[] = NETWORKS.map((n) => ({
    value: n.key,
    label: n.label,
    hint: k("arrivalMinutes").replace("{minutes}", String(n.minutes)),
    meta: `${n.fee} ${PAY_SYMBOL}`,
  }));

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={k("title")}
        subtitle={k("subtitle")}
        action={
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
            <span aria-hidden className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-hero-mint opacity-70" />
              <span className="relative h-2 w-2 rounded-full bg-hero-mint" />
            </span>
            <span className="text-[12px]! text-muted">{k("liveRate")}</span>
            <span className="text-[13px]! font-bold! tabular-nums">
              1 {coin.symbol} = {fiat(coin.rate)} {PAY_SYMBOL}
            </span>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Form ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          {/* Source — a segmented control rather than two tabs, because it
              switches one field on and off rather than swapping the whole view. */}
          <div
            role="radiogroup"
            aria-label={k("source")}
            className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface p-1.5"
          >
            {(["inside", "outside"] as const).map((option) => {
              const active = source === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSource(option)}
                  className={cn(
                    "cursor-pointer rounded-xl px-3 py-2.5 text-center transition",
                    active
                      ? "bg-primary text-white shadow-[0_8px_20px_rgb(var(--primary__color)/0.32)]"
                      : "text-muted hover:text-heading",
                  )}
                >
                  <span className="flex items-center justify-center gap-2 text-[13.5px] font-semibold">
                    {option === "inside" ? <Wallet size={15} /> : <ArrowUpFromLine size={15} />}
                    {k(option === "inside" ? "insideWallet" : "outsideWallet")}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11.5px]",
                      active ? "text-white/80" : "text-muted",
                    )}
                  >
                    {k(option === "inside" ? "insideWalletHint" : "outsideWalletHint")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---- Sell / get pair ---- */}
          <div className="relative mt-6">
            <AmountField
              label={k("youSell")}
              value={sellValue}
              onChange={(v) => {
                setSide("sell");
                setSellRaw(v);
              }}
              onBlur={() => setTouched(true)}
              error={Boolean(error)}
              selector={
                <SelectMenu
                  label={k("selectCoin")}
                  value={coinKey}
                  options={coinOptions}
                  onChange={setCoinKey}
                  showHintInTrigger={false}
                  className="w-38 shrink-0"
                />
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px]! text-muted">
                    {k(source === "inside" ? "balance" : "sellableMax")}:{" "}
                    <span className="font-semibold tabular-nums text-heading">
                      {crypto(sellable) || "0"} {coin.symbol}
                    </span>
                  </span>
                  <div className="flex gap-1.5">
                    {PERCENTS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPercent(pct)}
                        className="cursor-pointer rounded-lg border border-border px-2 py-1 text-[11.5px] font-semibold text-muted transition hover:border-primary hover:text-primary"
                      >
                        {pct === 100 ? k("max") : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />

            {/* Conversion glyph, straddling the seam between the two fields. */}
            <div className="relative z-[1] flex h-0 items-center justify-center">
              <span
                aria-hidden
                className="grid! h-9 w-9 place-items-center rounded-full border-4 border-card bg-primary text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.35)]"
              >
                <ArrowDown size={15} />
              </span>
            </div>

            <AmountField
              className="mt-2"
              label={k("youGet")}
              value={getValue}
              onChange={(v) => {
                setSide("get");
                setGetRaw(v);
              }}
              suffix={PAY_SYMBOL}
              footer={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]! text-muted">
                  <span>
                    {k("minAmount")}:{" "}
                    <span className="tabular-nums">
                      {crypto(coin.min)} {coin.symbol}
                    </span>
                  </span>
                  <span>
                    {k("maxAmount")}:{" "}
                    <span className="tabular-nums">
                      {crypto(coin.max)} {coin.symbol}
                    </span>
                  </span>
                </div>
              }
            />
          </div>

          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px]! text-hero-neg">
              <TriangleAlert size={13} aria-hidden className="shrink-0" />
              {error}
            </p>
          )}

          {/* ---- Network ---- */}
          <div className="mt-6">
            <FieldLabel hint={k("networkHint")}>{k("network")}</FieldLabel>
            <SelectMenu
              label={k("network")}
              value={networkKey}
              options={networkOptions}
              onChange={setNetworkKey}
            />
          </div>

          {/* ---- Deposit address, only when the coins come from outside ---- */}
          {source === "outside" && (
            <div className="mt-5">
              <FieldLabel>{k("depositAddress")}</FieldLabel>
              <div className="flex h-13 items-center gap-2 rounded-xl border border-border bg-surface pr-1.5 pl-3">
                {/* Read-only, not an input: the address is issued by us, and a
                    field the user can edit invites them to "fix" it. */}
                <span className="min-w-0 flex-1 truncate font-mono text-[13px]! text-heading">
                  {DEPOSIT_ADDRESS[network.key]}
                </span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-[12.5px] font-semibold text-primary transition hover:bg-primary/18"
                >
                  <Copy size={14} aria-hidden />
                  {k("copy")}
                </button>
              </div>

              <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px]! leading-relaxed! text-amber-700 dark:text-amber-300">
                <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
                {k("addressWarning")
                  .replace("{coin}", coin.symbol)
                  .replace("{network}", network.label)}
              </p>
            </div>
          )}

          {/* ---- Payout method ---- */}
          <div className="mt-6">
            <FieldLabel>{k("payoutMethod")}</FieldLabel>
            <div
              role="radiogroup"
              aria-label={k("payoutMethod")}
              className="grid gap-2.5 sm:grid-cols-3"
            >
              {METHODS.map((option) => {
                const active = method === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethod(option)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 text-left transition",
                      active
                        ? "border-primary bg-primary/8 ring-2 ring-primary/20"
                        : "border-border bg-surface hover:border-primary/60",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-heading">
                        {k(`methods.${option}`)}
                      </span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid! h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
                          active ? "border-primary" : "border-border",
                        )}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11.5px] text-muted">
                      {k(`methodsHint.${option}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        {/* ------------------------- Summary ------------------------- */}
        <div className="lg:sticky lg:top-6 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <h2 className="text-[16px]! font-bold!">{k("summary")}</h2>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <CoinBadge color={coin.color} glyph={coin.glyph} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]! font-bold!">
                  {crypto(sellNum) || "0"} {coin.symbol}
                </div>
                <div className="truncate text-[12px]! text-muted">{coin.name}</div>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[11.5px] font-semibold text-primary">
                {k(source === "inside" ? "insideWallet" : "outsideWallet")}
              </span>
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={k("rate")}>
                1 {coin.symbol} = {fiat(coin.rate)} {PAY_SYMBOL}
              </Row>
              <Row label={k("subtotal")}>
                {fiat(grossNum)} {PAY_SYMBOL}
              </Row>
              {surcharge > 0 && (
                <Row label={k("processingFee")}>
                  − {fiat(surcharge)} {PAY_SYMBOL}
                </Row>
              )}
              <Row label={k("networkFee")}>
                − {fiat(network.fee)} {PAY_SYMBOL}
              </Row>
              <Row label={k("arrival")}>
                <span className="inline-flex! items-center gap-1.5">
                  <Clock size={13} aria-hidden className="text-muted" />
                  {k("arrivalMinutes").replace("{minutes}", String(network.minutes))}
                </span>
              </Row>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="text-[13.5px]! font-semibold!">{k("totalPayout")}</span>
              <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                {fiat(payout)} {PAY_SYMBOL}
              </span>
            </div>

            <button
              type="button"
              onClick={submit}
              className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white shadow-[0_12px_28px_rgb(var(--primary__color)/0.35)] transition hover:-translate-y-0.5 hover:opacity-95"
            >
              <Lock size={15} aria-hidden />
              {k("continue")}
            </button>

            <p className="mt-3 flex items-start gap-2 text-[11.5px]! leading-relaxed! text-muted">
              <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-hero-mint" />
              {k("secured")}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
