"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Clock, Lock, ShieldCheck, TriangleAlert, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import {
  AmountField,
  LiveRatePill,
  PercentChips,
  Row,
} from "@/components/dashboard/TradeFields";
import { COINS, PAY_SYMBOL, PERCENTS, crypto, fiat, floor8, toNumber } from "@/config/market";

/**
 * Conversion spread, as a fraction of the destination amount. An internal swap
 * never touches a chain, so there is no network fee to charge — this is the only
 * cost, and it comes out of what lands in the destination coin.
 */
const FEE_RATE = 0.001;

/** How long the quoted rate is held once the order is placed. */
const RATE_LOCK_SECONDS = 30;

export function ExchangeCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`exchangeCrypto.${name}`);

  const [fromKey, setFromKey] = useState<string>(COINS[0].key);
  const [toKey, setToKey] = useState<string>(COINS[1].key);
  const [touched, setTouched] = useState(false);

  // One side is the raw input, the other is derived from it. Tracking WHICH was
  // last typed in is what keeps a half-typed "0.0" from being rewritten into
  // "0" by its own round-trip through the cross rate.
  const [side, setSide] = useState<"from" | "to">("from");
  const [fromRaw, setFromRaw] = useState("");
  const [toRaw, setToRaw] = useState("");

  const from = COINS.find((c) => c.key === fromKey) ?? COINS[0];
  const to = COINS.find((c) => c.key === toKey) ?? COINS[1];

  /** Both coins are priced in the settlement currency, so the pair is their ratio. */
  const crossRate = from.rate / to.rate;

  const fromValue = side === "from" ? fromRaw : crypto(toNumber(toRaw) / crossRate);
  const toValue = side === "to" ? toRaw : crypto(toNumber(fromRaw) * crossRate);

  const fromNum = toNumber(fromValue);
  const grossTo = fromNum * crossRate;
  const fee = grossTo * FEE_RATE;
  const receive = Math.max(0, grossTo - fee);

  /** An internal swap is bounded by the balance and by the pair's order limit. */
  const sellable = floor8(Math.min(from.balance, from.max));

  const error = useMemo(() => {
    if (!touched) return null;
    if (fromNum <= 0) return k("errorAmount");
    if (fromNum < from.min)
      return k("errorMin").replace("{min}", crypto(from.min)).replace("{coin}", from.symbol);
    if (fromNum > from.max)
      return k("errorMax").replace("{max}", crypto(from.max)).replace("{coin}", from.symbol);
    if (fromNum > from.balance)
      return k("errorBalance")
        .replace("{balance}", crypto(from.balance))
        .replace("{coin}", from.symbol);
    return null;
  }, [touched, fromNum, from]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Flips the pair and carries the amounts across with it, so the number the
   * user was looking at on one side is the one they get on the other.
   */
  function swapPair() {
    setFromKey(toKey);
    setToKey(fromKey);
    setSide("from");
    setFromRaw(toValue);
    setToRaw("");
  }

  /** A pair needs two different coins — picking the twin swaps rather than blocks. */
  function pickFrom(next: string) {
    if (next === toKey) setToKey(fromKey);
    setFromKey(next);
  }

  function pickTo(next: string) {
    if (next === fromKey) setFromKey(toKey);
    setToKey(next);
  }

  const setPercent = (pct: number) => {
    setSide("from");
    setFromRaw(crypto(floor8((sellable * pct) / 100)));
  };

  function submit() {
    setTouched(true);
    // `error` is memoised against the pre-click state, so re-check the conditions
    // a first-time click can trip.
    if (fromNum <= 0 || fromNum < from.min || fromNum > from.max) return;
    if (fromNum > from.balance) return;
    toast.success(
      k("submitted")
        .replace("{from}", `${crypto(fromNum)} ${from.symbol}`)
        .replace("{to}", `${crypto(receive)} ${to.symbol}`),
    );
  }

  const coinOption = (c: (typeof COINS)[number]): SelectOption => ({
    value: c.key,
    label: c.symbol,
    hint: c.name,
    meta: `$${fiat(c.rate)}`,
    icon: <CoinBadge color={c.color} glyph={c.glyph} />,
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={k("title")}
        subtitle={k("subtitle")}
        action={
          <LiveRatePill label={k("liveRate")}>
            1 {from.symbol} = {crypto(crossRate)} {to.symbol}
          </LiveRatePill>
        }
      />

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Form ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <div className="relative">
            <AmountField
              label={k("from")}
              value={fromValue}
              onChange={(v) => {
                setSide("from");
                setFromRaw(v);
              }}
              onBlur={() => setTouched(true)}
              error={Boolean(error)}
              selector={
                <SelectMenu
                  label={k("selectFrom")}
                  value={fromKey}
                  options={COINS.map(coinOption)}
                  onChange={pickFrom}
                  showHintInTrigger={false}
                  className="w-38 shrink-0"
                />
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px]! text-muted">
                    {k("balance")}:{" "}
                    <span className="font-semibold tabular-nums text-heading">
                      {crypto(sellable) || "0"} {from.symbol}
                    </span>
                  </span>
                  <PercentChips percents={PERCENTS} maxLabel={k("max")} onPick={setPercent} />
                </div>
              }
            />

            {/* The swap control, straddling the seam. On Buy and Sell this spot
                holds a static arrow; here the pair is reversible, so it is the
                page's one signature action and gets to be a real button. */}
            <div className="relative z-[1] flex h-0 items-center justify-center">
              <button
                type="button"
                onClick={swapPair}
                aria-label={k("swap")}
                title={k("swap")}
                className="grid! h-10 w-10 cursor-pointer place-items-center rounded-full border-4 border-card bg-primary text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.35)] transition hover:rotate-180 hover:opacity-95"
              >
                <ArrowUpDown size={16} aria-hidden />
              </button>
            </div>

            <AmountField
              className="mt-2"
              label={k("to")}
              value={toValue}
              onChange={(v) => {
                setSide("to");
                setToRaw(v);
              }}
              selector={
                <SelectMenu
                  label={k("selectTo")}
                  value={toKey}
                  options={COINS.map(coinOption)}
                  onChange={pickTo}
                  showHintInTrigger={false}
                  className="w-38 shrink-0"
                />
              }
              footer={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]! text-muted">
                  <span>
                    {k("minAmount")}:{" "}
                    <span className="tabular-nums">
                      {crypto(from.min)} {from.symbol}
                    </span>
                  </span>
                  <span>
                    {k("maxAmount")}:{" "}
                    <span className="tabular-nums">
                      {crypto(from.max)} {from.symbol}
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

          {/* ---- Pair overview ---- */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <PairCard coin={from} label={k("youConvert")} amount={crypto(fromNum) || "0"} />
            <PairCard coin={to} label={k("youReceive")} amount={crypto(receive) || "0"} />
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/8 px-3 py-2.5 text-[12px]! leading-relaxed! text-muted">
            <Zap size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
            {k("instantNote")}
          </p>
        </Panel>

        {/* ------------------------- Summary ------------------------- */}
        <div className="lg:sticky lg:top-6 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <h2 className="text-[16px]! font-bold!">{k("summary")}</h2>

            {/* The pair, read left to right, so the whole order is one glance. */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <CoinBadge color={from.color} glyph={from.glyph} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px]! font-bold!">{from.symbol}</div>
                <div className="truncate text-[11.5px]! text-muted">{from.name}</div>
              </div>
              <ArrowUpDown
                size={15}
                aria-hidden
                className="shrink-0 rotate-90 text-muted rtl:-rotate-90"
              />
              <div className="min-w-0 flex-1 text-right">
                <div className="truncate text-[13px]! font-bold!">{to.symbol}</div>
                <div className="truncate text-[11.5px]! text-muted">{to.name}</div>
              </div>
              <CoinBadge color={to.color} glyph={to.glyph} size={34} />
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={k("rate")}>
                1 {from.symbol} = {crypto(crossRate)} {to.symbol}
              </Row>
              <Row label={k("youConvert")}>
                {crypto(fromNum) || "0"} {from.symbol}
              </Row>
              <Row label={k("subtotal")}>
                {crypto(grossTo) || "0"} {to.symbol}
              </Row>
              <Row label={k("exchangeFee").replace("{percent}", String(FEE_RATE * 100))}>
                − {crypto(fee) || "0"} {to.symbol}
              </Row>
              <Row label={k("value")}>
                ≈ {fiat(receive * to.rate)} {PAY_SYMBOL}
              </Row>
              <Row label={k("arrival")}>
                <span className="inline-flex! items-center gap-1.5">
                  <Clock size={13} aria-hidden className="text-muted" />
                  {k("instant")}
                </span>
              </Row>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="text-[13.5px]! font-semibold!">{k("youReceive")}</span>
              <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                {crypto(receive) || "0"} {to.symbol}
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
              {k("secured").replace("{seconds}", String(RATE_LOCK_SECONDS))}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** One half of the pair, shown under the fields as a plain-language readback. */
function PairCard({
  coin,
  label,
  amount,
}: {
  coin: (typeof COINS)[number];
  label: string;
  amount: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border bg-surface p-3")}>
      <CoinBadge color={coin.color} glyph={coin.glyph} size={34} />
      <div className="min-w-0">
        <div className="text-[11.5px]! text-muted">{label}</div>
        <div className="truncate text-[14px]! font-bold! tabular-nums">
          {amount} {coin.symbol}
        </div>
      </div>
    </div>
  );
}
