"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ClipboardPaste,
  Clock,
  Lock,
  ShieldCheck,
  TriangleAlert,
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
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function WithdrawCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`withdrawCrypto.${name}`);

  const [coinKey, setCoinKey] = useState<string>(COINS[0].key);
  const [networkKey, setNetworkKey] = useState<string>(NETWORKS[0].key);
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState(false);

  // One side is the raw input, the other is derived from it. Tracking WHICH was
  // last typed in is what keeps a half-typed "0.0" from being rewritten into
  // "0" by its own round-trip through the network fee.
  const [side, setSide] = useState<"send" | "receive">("send");
  const [sendRaw, setSendRaw] = useState("");
  const [receiveRaw, setReceiveRaw] = useState("");

  const coin = COINS.find((c) => c.key === coinKey) ?? COINS[0];
  const network = NETWORKS.find((n) => n.key === networkKey) ?? NETWORKS[0];

  /**
   * The network's fee is quoted in the settlement currency but PAID in the coin
   * being moved — a withdrawal never touches a fiat balance — so it is converted
   * at the coin's own rate and deducted from the amount leaving the wallet.
   */
  const feeCrypto = floor8(network.fee / coin.rate);

  /** A withdrawal can never exceed the balance, nor the per-order ceiling. */
  const withdrawable = floor8(Math.min(coin.balance, coin.max));

  /**
   * The floor is not the order limit alone. At the smallest sizes the fee IS the
   * order — the shared table's minimum is about a dollar, and so is the fee, so a
   * minimum-size withdrawal would arrive as nothing. Lifting it to three times the
   * fee keeps at least two thirds of what leaves the wallet, and it makes the
   * network choice matter: a cheap chain can withdraw far smaller amounts.
   */
  const minSend = Math.max(coin.min, floor8(feeCrypto * 3));

  const sendValue = side === "send" ? sendRaw : crypto(floor8(toNumber(receiveRaw) + feeCrypto));
  const receiveValue =
    side === "receive" ? receiveRaw : crypto(Math.max(0, floor8(toNumber(sendRaw) - feeCrypto)));

  const sendNum = toNumber(sendValue);
  const receiveNum = Math.max(0, sendNum - feeCrypto);

  const error = useMemo(() => {
    if (!touched) return null;
    if (sendNum <= 0) return k("errorAmount");
    // `minSend` already clears the fee three times over, so an amount that passes
    // here can never arrive as nothing.
    if (sendNum < minSend)
      return k("errorMin").replace("{min}", crypto(minSend)).replace("{coin}", coin.symbol);
    if (sendNum > coin.max)
      return k("errorMax").replace("{max}", crypto(coin.max)).replace("{coin}", coin.symbol);
    if (sendNum > coin.balance)
      return k("errorBalance")
        .replace("{balance}", crypto(coin.balance))
        .replace("{coin}", coin.symbol);
    if (address.trim().length < 12) return k("errorAddress");
    return null;
  }, [touched, sendNum, coin, minSend, address]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPercent = (pct: number) => {
    setSide("send");
    setSendRaw(crypto(floor8((withdrawable * pct) / 100)));
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
    // `error` is memoised against the pre-click state, so re-check the conditions
    // a first-time click can trip.
    if (sendNum <= 0 || sendNum < minSend || sendNum > coin.max) return;
    if (sendNum > coin.balance) return;
    if (address.trim().length < 12) return;
    toast.success(k("submitted").replace("{amount}", `${crypto(receiveNum)} ${coin.symbol}`));
  }

  const coinOptions: SelectOption[] = COINS.map((c) => ({
    value: c.key,
    label: c.symbol,
    hint: c.name,
    // Balance, not price: on this page the question is "how much can I move".
    meta: crypto(floor8(c.balance)) || "0",
    icon: <CoinBadge color={c.color} glyph={c.glyph} />,
  }));

  const networkOptions: SelectOption[] = NETWORKS.map((n) => ({
    value: n.key,
    label: n.label,
    hint: k("arrivalMinutes").replace("{minutes}", String(n.minutes)),
    meta: `${crypto(floor8(n.fee / coin.rate))} ${coin.symbol}`,
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
          {/* ---- Send / receive pair. Unlike Buy and Sell there is no conversion
                  here: both sides are the same coin, and the gap between them is
                  the network's fee. ---- */}
          <div className="relative">
            <AmountField
              label={k("youSend")}
              value={sendValue}
              onChange={(v) => {
                setSide("send");
                setSendRaw(v);
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
                    {k("balance")}:{" "}
                    <span className="font-semibold tabular-nums text-heading">
                      {crypto(withdrawable) || "0"} {coin.symbol}
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
              label={k("theyReceive")}
              value={receiveValue}
              onChange={(v) => {
                setSide("receive");
                setReceiveRaw(v);
              }}
              suffix={coin.symbol}
              footer={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]! text-muted">
                  <span>
                    {k("limit")}:{" "}
                    <span className="tabular-nums">
                      {crypto(minSend)} – {crypto(coin.max)} {coin.symbol}
                    </span>
                  </span>
                  <span>
                    {k("networkFee")}:{" "}
                    <span className="tabular-nums">
                      {crypto(feeCrypto)} {coin.symbol}
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

          {/* ---- Destination address ---- */}
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
        </Panel>

        {/* ------------------------- Summary ------------------------- */}
        <div className="lg:sticky lg:top-6 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <h2 className="text-[16px]! font-bold!">{k("summary")}</h2>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <CoinBadge color={coin.color} glyph={coin.glyph} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]! font-bold!">
                  {crypto(sendNum) || "0"} {coin.symbol}
                </div>
                <div className="truncate text-[12px]! text-muted">{coin.name}</div>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[11.5px] font-semibold text-primary">
                {network.label}
              </span>
            </div>

            {/* The destination, echoed back. A withdrawal is the one order the user
                cannot undo, so the address they typed is repeated where they are
                about to confirm it. */}
            <div className="mt-3 rounded-xl border border-border bg-surface p-3">
              <span className="text-[11.5px]! text-muted">{k("walletAddress")}</span>
              <p
                className={cn(
                  "mt-1 font-mono text-[12px]! leading-relaxed! break-all",
                  address.trim() ? "text-heading" : "text-muted",
                )}
              >
                {address.trim() || k("addressEmpty")}
              </p>
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={k("amount")}>
                {crypto(sendNum) || "0"} {coin.symbol}
              </Row>
              <Row label={k("networkFee")}>
                − {crypto(feeCrypto)} {coin.symbol}
              </Row>
              <Row label={k("valueNow")}>
                ≈ {fiat(receiveNum * coin.rate)} {PAY_SYMBOL}
              </Row>
              <Row label={k("arrival")}>
                <span className="inline-flex! items-center gap-1.5">
                  <Clock size={13} aria-hidden className="text-muted" />
                  {k("arrivalMinutes").replace("{minutes}", String(network.minutes))}
                </span>
              </Row>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="text-[13.5px]! font-semibold!">{k("totalReceive")}</span>
              <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                {crypto(receiveNum) || "0"} {coin.symbol}
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
