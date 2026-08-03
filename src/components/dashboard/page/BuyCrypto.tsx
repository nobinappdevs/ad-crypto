"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ClipboardPaste,
  Clock,
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
  toNumber,
} from "@/config/market";

/* -------------------------------------------------------------------------- */
/* Buy-side options                                                            */
/* -------------------------------------------------------------------------- */

const METHODS = ["coingate", "card", "bank"] as const;
/** Processing surcharge as a fraction of the order — card rails cost more. */
const METHOD_SURCHARGE: Record<string, number> = { coingate: 0, card: 0.015, bank: 0 };

/** Demo settlement-currency balance, so the percentage chips have something to divide. */
const BALANCE = 12480.35;

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function BuyCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`buyCrypto.${name}`);

  const [destination, setDestination] = useState<"inside" | "outside">("inside");
  const [coinKey, setCoinKey] = useState<string>(COINS[0].key);
  const [networkKey, setNetworkKey] = useState<string>(NETWORKS[0].key);
  const [method, setMethod] = useState<string>(METHODS[0]);
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState(false);

  // One side is the raw input, the other is derived from it. Tracking WHICH was
  // last typed in is what keeps a half-typed "0.0" from being rewritten into
  // "0" by its own round-trip through the exchange rate.
  const [side, setSide] = useState<"pay" | "receive">("pay");
  const [payRaw, setPayRaw] = useState("1000");
  const [receiveRaw, setReceiveRaw] = useState("");

  const coin = COINS.find((c) => c.key === coinKey) ?? COINS[0];
  const network = NETWORKS.find((n) => n.key === networkKey) ?? NETWORKS[0];

  const payValue = side === "pay" ? payRaw : crypto(toNumber(receiveRaw) * coin.rate);
  const receiveValue = side === "receive" ? receiveRaw : crypto(toNumber(payRaw) / coin.rate);

  const receiveNum = toNumber(receiveValue);
  const payNum = toNumber(payValue);

  const surcharge = payNum * (METHOD_SURCHARGE[method] ?? 0);
  const total = payNum + surcharge + network.fee;

  const error = useMemo(() => {
    if (!touched) return null;
    if (receiveNum <= 0) return k("errorAmount");
    if (receiveNum < coin.min)
      return k("errorMin").replace("{min}", crypto(coin.min)).replace("{coin}", coin.symbol);
    if (receiveNum > coin.max)
      return k("errorMax").replace("{max}", crypto(coin.max)).replace("{coin}", coin.symbol);
    if (destination === "outside" && address.trim().length < 12) return k("errorAddress");
    return null;
  }, [touched, receiveNum, coin, destination, address]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPercent = (pct: number) => {
    setSide("pay");
    setPayRaw(crypto((BALANCE * pct) / 100));
  };

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddress(text.trim());
        return;
      }
    } catch {}
    toast.error(k("pasteFailed"));
  }

  function submit() {
    setTouched(true);
    // `error` is memoised against the pre-click state, so re-check the two
    // conditions a first-time click can trip.
    if (receiveNum <= 0 || receiveNum < coin.min || receiveNum > coin.max) return;
    if (destination === "outside" && address.trim().length < 12) return;
    toast.success(k("submitted").replace("{amount}", `${crypto(receiveNum)} ${coin.symbol}`));
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
          {/* Destination — a segmented control rather than two tabs, because it
              switches one field on and off rather than swapping the whole view. */}
          <div
            role="radiogroup"
            aria-label={k("destination")}
            className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface p-1.5"
          >
            {(["inside", "outside"] as const).map((option) => {
              const active = destination === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setDestination(option)}
                  className={cn(
                    "cursor-pointer rounded-xl px-3 py-2.5 text-center transition",
                    active
                      ? "bg-primary text-white shadow-[0_8px_20px_rgb(var(--primary__color)/0.32)]"
                      : "text-muted hover:text-heading",
                  )}
                >
                  <span className="flex items-center justify-center gap-2 text-[13.5px] font-semibold">
                    {option === "inside" ? <Wallet size={15} /> : <ArrowDown size={15} />}
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

          {/* ---- Pay / receive pair ---- */}
          <div className="relative mt-6">
            <AmountField
              label={k("youPay")}
              value={payValue}
              onChange={(v) => {
                setSide("pay");
                setPayRaw(v);
              }}
              suffix={PAY_SYMBOL}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px]! text-muted">
                    {k("balance")}:{" "}
                    <span className="font-semibold tabular-nums text-heading">
                      {fiat(BALANCE)} {PAY_SYMBOL}
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
              label={k("youReceive")}
              value={receiveValue}
              onChange={(v) => {
                setSide("receive");
                setReceiveRaw(v);
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

          {/* ---- Address, only when the coins leave the platform ---- */}
          {destination === "outside" && (
            <div className="mt-5">
              <FieldLabel>{k("walletAddress")}</FieldLabel>
              <div
                className={cn(
                  "flex h-13 items-center gap-2 rounded-xl border bg-surface pr-1.5 pl-3 transition focus-within:ring-2",
                  error && !address.trim()
                    ? "border-hero-neg focus-within:ring-hero-neg/25"
                    : "border-border focus-within:border-primary focus-within:ring-primary/20",
                )}
              >
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={k("addressPlaceholder")}
                  spellCheck={false}
                  aria-label={k("walletAddress")}
                  className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-heading outline-none placeholder:font-sans placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={paste}
                  className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-[12.5px] font-semibold text-primary transition hover:bg-primary/18"
                >
                  <ClipboardPaste size={14} aria-hidden />
                  {k("paste")}
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

          {/* ---- Payment method ---- */}
          <div className="mt-6">
            <FieldLabel>{k("paymentMethod")}</FieldLabel>
            <div role="radiogroup" aria-label={k("paymentMethod")} className="grid gap-2.5 sm:grid-cols-3">
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
                  {crypto(receiveNum) || "0"} {coin.symbol}
                </div>
                <div className="truncate text-[12px]! text-muted">{coin.name}</div>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[11.5px] font-semibold text-primary">
                {k(destination === "inside" ? "insideWallet" : "outsideWallet")}
              </span>
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={k("rate")}>
                1 {coin.symbol} = {fiat(coin.rate)} {PAY_SYMBOL}
              </Row>
              <Row label={k("subtotal")}>
                {fiat(payNum)} {PAY_SYMBOL}
              </Row>
              {surcharge > 0 && (
                <Row label={k("processingFee")}>
                  {fiat(surcharge)} {PAY_SYMBOL}
                </Row>
              )}
              <Row label={k("networkFee")}>
                {fiat(network.fee)} {PAY_SYMBOL}
              </Row>
              <Row label={k("arrival")}>
                <span className="inline-flex! items-center gap-1.5">
                  <Clock size={13} aria-hidden className="text-muted" />
                  {k("arrivalMinutes").replace("{minutes}", String(network.minutes))}
                </span>
              </Row>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="text-[13.5px]! font-semibold!">{k("totalPay")}</span>
              <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                {fiat(total)} {PAY_SYMBOL}
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
