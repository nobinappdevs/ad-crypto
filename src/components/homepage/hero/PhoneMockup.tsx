"use client";

import type { RefObject } from "react";
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
  { key: "buy", glyph: "＋" },
  { key: "send", glyph: "↑" },
  { key: "swap", glyph: "⇄" },
];

const HOLDINGS = [
  { glyph: "₿", key: "btc", units: "0.2418 BTC", value: "$15,336.02", change: "+2.41%", up: true },
  { glyph: "Ξ", key: "eth", units: "2.140 ETH", value: "$6,815.30", change: "+1.18%", up: true },
];

/**
 * Price cards floating over the device.
 *
 * They overlap it heavily — and can, because the screen deliberately leaves the
 * 158px-342px band empty for exactly this purpose. Move either the cards or the
 * screen's content and that clearance is what breaks.
 *
 * Unlike the phone itself these DO follow the theme, via the `card-*` tokens: an
 * opaque white card with a cast shadow on the light hero, translucent glass on
 * the dark one.
 */
const FLOATING = [
  {
    key: "eth",
    glyph: "Ξ",
    name: "Ethereum",
    ticker: "ETH",
    price: "$1,467.38",
    change: "+7.1%",
    tinted: true,
    // Mobile offsets are measured from the phone's OUTER edge, while the screen's
    // content sits 6px inside it — so the band's usable top is 164px, not 158px.
    box: "top-[186px] inset-x-4 h-[74px] lg:top-[196px] lg:inset-x-auto lg:-left-24 lg:w-[330px]",
    duration: "6s",
    reverse: false,
  },
  {
    key: "busd",
    glyph: "B",
    name: "BinanceUSD",
    ticker: "BUSD",
    price: "$1.65",
    change: "+0.2%",
    tinted: false,
    box: "top-[266px] inset-x-4 h-[68px] lg:top-[276px] lg:inset-x-auto lg:-left-13 lg:w-[330px]",
    duration: "7.5s",
    reverse: true,
  },
];

const BEZEL_SHADOW =
  "0 -20px 70px rgb(0 0 0 / 0.55), 0 0 0 8px rgb(var(--phone-bezel) / 0.9)";

export function PhoneMockup({
  phoneRef,
  bezelRef,
}: {
  phoneRef: RefObject<HTMLDivElement | null>;
  bezelRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLang();

  return (
    // Fixed 300x600 at every breakpoint. The screen's contents are absolutely
    // positioned at the design's exact offsets, so scaling the box would need all
    // of them re-derived; 300px still clears the narrowest phone viewport.
    <div
      ref={phoneRef}
      data-hero-phone
      className="relative z-7 mx-auto h-150 w-75 origin-top lg:absolute lg:top-[calc(100%-334px)] lg:left-1/2 lg:mx-0"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Bezel. The mask fades the phone's bottom into the hero on first paint;
          the scroll handler removes it once the phone starts travelling. */}
      <div
        ref={bezelRef}
        data-hero-bezel
        className="absolute inset-0 overflow-hidden rounded-[44px] border border-phone-border bg-phone-bezel"
        style={{ boxShadow: BEZEL_SHADOW }}
      >
        <div
          className="absolute inset-1.5 overflow-hidden rounded-[38px] text-phone-fg"
          style={{ background: "var(--phone-screen)" }}
        >
          {/* Status bar */}
          <div className="absolute inset-x-0 top-0 flex h-11 items-center justify-between px-5.5 text-[12px] font-semibold">
            <div>{t("hero.phoneTime")}</div>
            <div aria-hidden className="tracking-[1px] opacity-85">
              ▮▮ ⌁
            </div>
          </div>
          <div
            aria-hidden
            className="absolute top-2.5 left-1/2 h-6.5 w-22 -translate-x-1/2 rounded-full bg-phone-notch"
          />

          {/* Portfolio block */}
          <div className="absolute top-19 left-5.5 text-[12px] text-phone-fg-muted">
            {t("hero.phonePortfolioLabel")}
          </div>
          <div className="absolute top-24 left-5.5 text-[30px] leading-none font-bold tracking-[-0.02em]">
            {t("hero.phonePortfolioValue")}
          </div>
          <div className="absolute top-34 left-5.5 text-[12px] font-semibold text-phone-mint">
            {t("hero.phonePortfolioChange")}
          </div>
          <div
            aria-hidden
            className="absolute top-[62px] right-5 flex h-9 w-22 items-end gap-0.5"
          >
            {BARS.map((height, i) => (
              <span
                key={i}
                className="flex-1 rounded-[1.5px] bg-phone-fg/42"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <div className="absolute top-[158px] inset-x-5.5 flex items-center gap-2 text-[11px] text-phone-fg-muted">
            <span aria-hidden className="h-1.25 w-1.25 shrink-0 rounded-full bg-phone-mint" />
            <span className="truncate">{t("hero.phoneCustody")}</span>
          </div>

          {/* 158px-342px is intentionally clear — the floating cards sit here. */}

          {/* Quick actions */}
          <div className="absolute top-[342px] inset-x-4 grid grid-cols-3 gap-2">
            {ACTIONS.map((action) => (
              <div
                key={action.key}
                className="flex h-15 flex-col items-center justify-center gap-1.25 rounded-2xl border border-phone-border bg-phone-surface"
              >
                <div aria-hidden className="text-[15px] leading-none">
                  {action.glyph}
                </div>
                <div className="text-[11px] font-semibold text-phone-fg/90">
                  {t(`hero.phoneAction${action.key[0].toUpperCase()}${action.key.slice(1)}`)}
                </div>
              </div>
            ))}
          </div>

          {/* Assets */}
          <div className="absolute top-[410px] inset-x-5.5 flex items-center justify-between text-[11.5px] font-semibold tracking-[0.04em] text-phone-fg/62 uppercase">
            <div>{t("hero.phoneAssets")}</div>
            <div className="font-medium tracking-normal normal-case">{t("hero.phoneSeeAll")}</div>
          </div>

          <div className="absolute top-[428px] inset-x-4 flex flex-col gap-1.25">
            {HOLDINGS.map((coin) => (
              <div
                key={coin.key}
                className="flex h-[41px] items-center gap-2.5 rounded-[14px] bg-phone-fg/7 px-3"
              >
                <div
                  aria-hidden
                  className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-phone-chip text-[12px] font-bold text-primary"
                >
                  {coin.glyph}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold">
                    {t(`hero.phoneCoin.${coin.key}`)}
                  </div>
                  <div className="text-[10.5px] text-phone-fg/58">{coin.units}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[12.5px] font-semibold">{coin.value}</div>
                  <div
                    className={`text-[10.5px] font-semibold ${coin.up ? "text-phone-mint" : "text-phone-fg/58"}`}
                  >
                    {coin.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA, pinned to the bottom of the screen */}
          <div className="absolute inset-x-4 bottom-4.5 flex h-[46px] items-center justify-center rounded-2xl bg-white text-[13.5px] font-semibold text-hero-badge">
            {t("hero.phoneBuyCrypto")}
          </div>
        </div>
      </div>

      {FLOATING.map((coin) => (
        <div
          key={coin.key}
          // Below `lg` there is no room beside a 300px phone, so these sit INSIDE
          // the screen's empty band instead of floating outside it — otherwise
          // hiding them leaves that reserved gap as a blank slab.
          className={`absolute flex items-center gap-3 rounded-[20px] border border-card-line bg-card-glass px-4.5 text-card-fg shadow-float backdrop-blur-[14px] ${coin.box}`}
          style={{
            animation: `float-y ${coin.duration} ease-in-out infinite ${coin.reverse ? "reverse" : ""}`,
          }}
        >
          <div
            aria-hidden
            className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-card-chip text-[15px] font-bold text-primary"
          >
            {coin.glyph}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold">{coin.name}</div>
            <div className="text-[11.5px] opacity-62">{coin.ticker}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[14px] font-semibold">{coin.price}</div>
            <div className={`text-[11.5px] ${coin.tinted ? "text-hero-mint" : "opacity-62"}`}>
              {coin.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
