"use client";

import type { RefObject } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Home, PieChart, Repeat, User } from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * Deterministic sparkline bars — computed from a fixed formula rather than
 * Math.random() so server and client markup always match.
 */
const BARS = Array.from({ length: 14 }, (_, i) => {
  const v = Math.sin(i * 0.72) * 0.3 + Math.sin(i * 1.9) * 0.16 + 0.55;
  return Math.round(Math.max(0.22, Math.min(1, v)) * 36);
});

const ACTIONS = [
  { key: "buy", icon: ArrowDownLeft },
  { key: "sell", icon: ArrowUpRight },
  { key: "swap", icon: Repeat },
];

/** Holdings list that fills the lower half of the screen. */
const HOLDINGS = [
  { symbol: "₿", name: "Bitcoin", ticker: "BTC", amount: "0.4128", value: "$18,204.10", change: "+2.4%", up: true },
  { symbol: "Ξ", name: "Ethereum", ticker: "ETH", amount: "3.204", value: "$4,701.55", change: "+7.1%", up: true },
  { symbol: "₮", name: "Tether", ticker: "USDT", amount: "2,012.75", value: "$2,012.75", change: "-0.1%", up: false },
  { symbol: "◎", name: "Solana", ticker: "SOL", amount: "12.60", value: "$1,884.20", change: "+3.8%", up: true },
];

const TABS = [Home, PieChart, Repeat, User];

/**
 * Glass cards floating beside the phone, desktop-only.
 *
 * The reference design overlaps them far across the phone, but its phone is
 * sparse — the cards visually FILL its empty lower half. Ours is a full wallet
 * UI, so the overlap is capped at the screen's 26px inner padding (6px bezel
 * inset + 20px px-5). Past that they'd cover the Buy/Sell/Swap row.
 * On mobile there is no room beside a 288px phone, and the holdings list
 * already carries the same information, so they're hidden.
 */
const FLOATING = [
  {
    symbol: "Ξ",
    name: "Ethereum",
    ticker: "ETH",
    price: "$1,467.38",
    change: "+7.1%",
    up: true,
    position: "lg:top-[168px] lg:-left-[284px] lg:w-75",
    duration: "6s",
    reverse: false,
  },
  {
    symbol: "B",
    name: "BinanceUSD",
    ticker: "BUSD",
    price: "$1.65",
    change: "+0.2%",
    up: false,
    position: "lg:top-[264px] lg:-left-[276px] lg:w-75",
    // 24px of overlap — inside the screen's padding, so no UI is hidden.
    duration: "7.5s",
    reverse: true,
  },
];

export function PhoneMockup({
  phoneRef,
  bezelRef,
}: {
  phoneRef: RefObject<HTMLDivElement | null>;
  bezelRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLang();

  return (
    <div
      ref={phoneRef}
      data-hero-phone
      className="relative z-7 mx-auto h-150 w-[288px] origin-top sm:w-75 lg:absolute lg:top-[566px] lg:left-1/2 lg:mx-0 lg:w-75"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Bezel. The mask fades the phone's bottom into the hero on first paint;
          the scroll handler removes it once the phone starts travelling. */}
      <div
        ref={bezelRef}
        data-hero-bezel
        className="absolute inset-0 overflow-hidden rounded-[44px] border border-phone-border bg-phone-bezel shadow-[0_-20px_70px_rgb(0_0_0/0.28),0_0_0_8px_rgb(var(--phone-bezel)/0.92)]"
      >
        {/* Screen. Follows the theme: vivid indigo in dark, light lavender in light. */}
        <div
          className="absolute inset-1.5 flex flex-col overflow-hidden rounded-[38px] text-phone-fg"
          style={{ background: "var(--phone-screen)" }}
        >
          {/* Status bar + notch */}
          <div className="relative flex h-11 shrink-0 items-center justify-between px-5 text-[12px] font-semibold">
            <span className="inline!">{t("hero.phoneTime")}</span>
            <span
              aria-hidden
              className="absolute top-2.5 left-1/2 h-6.5 w-22 -translate-x-1/2 rounded-full bg-phone-notch"
            />
            <span aria-hidden className="inline! tracking-widest opacity-85">
              ▮▮ ⌁
            </span>
          </div>

          {/* Portfolio header */}
          <div className="shrink-0 px-5 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[11.5px] text-phone-fg-muted">
                  {t("hero.phonePortfolioLabel")}
                </span>
                <span className="mt-1 block text-[27px] leading-none font-bold tracking-tight">
                  {t("hero.phonePortfolioValue")}
                </span>
                <span className="mt-1.5 block text-[11.5px] font-semibold text-phone-mint">
                  {t("hero.phonePortfolioChange")}
                </span>
              </div>
              <div aria-hidden className="mt-1 flex h-9 w-21 shrink-0 items-end gap-0.5">
                {BARS.map((height, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-[1.5px] bg-phone-fg/40"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[10.5px] text-phone-fg-muted">
              <span aria-hidden className="h-1.25 w-1.25 shrink-0 rounded-full bg-phone-mint" />
              <span className="inline! truncate">{t("hero.phoneCustody")}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 grid shrink-0 grid-cols-3 gap-2 px-5">
            {ACTIONS.map(({ key, icon: Icon }) => (
              <span
                key={key}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-phone-border bg-phone-surface py-2.5 text-[10.5px] font-semibold"
              >
                <Icon size={15} aria-hidden />
                {t(`hero.phoneAction${key[0].toUpperCase()}${key.slice(1)}`)}
              </span>
            ))}
          </div>

          {/* Holdings — this is what used to be empty space. */}
          <div className="mt-4 flex min-h-0 flex-1 flex-col px-5">
            <span className="mb-2 block text-[10.5px] font-semibold tracking-widest text-phone-fg-muted uppercase">
              {t("hero.phoneHoldings")}
            </span>
            <div className="flex flex-col gap-2">
              {HOLDINGS.map((coin) => (
                <span
                  key={coin.ticker}
                  className="flex items-center gap-2.5 rounded-2xl bg-phone-surface px-2.5 py-2"
                >
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hero-accent text-[13px] font-bold text-white"
                  >
                    {coin.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">{coin.name}</span>
                    <span className="block text-[10px] text-phone-fg-muted">
                      {coin.amount} {coin.ticker}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[12px] font-semibold">{coin.value}</span>
                    <span
                      className={`block text-[10px] ${coin.up ? "text-phone-mint" : "text-phone-fg-muted"}`}
                    >
                      {coin.change}
                    </span>
                  </span>
                </span>
              ))}
            </div>

            {/* Pinned to the bottom of the remaining space so the screen never
                shows a dead gap above the tab bar. */}
            <span className="mt-auto mb-3 flex items-center justify-center gap-1.5 rounded-full border border-phone-border bg-phone-surface py-2 text-[10.5px] font-semibold">
              {t("hero.phoneViewAll")}
              <ChevronRight size={12} aria-hidden />
            </span>
          </div>

          {/* Bottom tab bar */}
          <div
            aria-hidden
            className="mt-3 flex shrink-0 items-center justify-around border-t border-phone-border bg-phone-tabbar px-4 pt-2.5 pb-3"
          >
            {TABS.map((Icon, i) => (
              <Icon key={i} size={17} className={i === 0 ? "text-hero-accent" : "text-phone-fg-muted"} />
            ))}
          </div>
          <span
            aria-hidden
            className="mx-auto mb-2 block h-1 w-26 shrink-0 rounded-full bg-phone-fg/30"
          />
        </div>
      </div>

      {FLOATING.map((coin) => (
        <div
          key={coin.ticker}
          className={`absolute hidden items-center gap-3 rounded-[20px] border border-hero-border bg-hero-deep/85 px-4 py-3.5 text-hero-fg shadow-xl backdrop-blur-[14px] lg:flex ${coin.position}`}
          style={{
            animation: `float-y ${coin.duration} ease-in-out infinite ${coin.reverse ? "reverse" : ""}`,
          }}
        >
          <span
            aria-hidden
            className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-hero-accent text-[15px] font-bold text-white"
          >
            {coin.symbol}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">{coin.name}</span>
            <span className="block text-[11.5px] text-hero-fg-muted">{coin.ticker}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[14px] font-semibold">{coin.price}</span>
            <span
              className={`block text-[11.5px] ${coin.up ? "text-hero-mint" : "text-hero-fg-muted"}`}
            >
              {coin.change}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
