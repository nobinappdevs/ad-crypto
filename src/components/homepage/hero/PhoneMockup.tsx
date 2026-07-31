"use client";

import Image from "next/image";
import type { ReactNode, RefObject } from "react";
import {
  BatteryFull,
  ChevronDown,
  CircleUserRound,
  LayoutGrid,
  SignalHigh,
  Wifi,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * The screen is the app's real "Buy Crypto" flow, not an abstract portfolio
 * summary: balance carousel -> mode tabs -> wallet scope -> coin/network/payment/
 * amount form -> Continue. It is a flex COLUMN, unlike the rest of the hero's
 * absolutely-positioned pieces, because the form's rows have to stay in order
 * and share whatever height the device has left; the CTA is pinned to the bottom
 * with `mt-auto` and every gap above it is fixed, so the slack lands in one place.
 *
 * The device reads as a solid object WITHOUT being rotated or skewed: no
 * perspective, no tilt, it stands square to the viewer. The volume comes from
 * four flat layers instead — the banded metal rail, a graphite bezel between
 * that rail and the glass, side buttons that clear the frame by 1px, and one
 * diagonal sheen over the whole screen. (A transform is not an option anyway:
 * the scroll handler owns `transform` on this element.)
 */
const CARDS = [
  { key: "btc", glyph: "₿", ticker: "BTC", balance: "1000.000", chip: "#f7931a", fg: "#ffffff" },
  { key: "eth", glyph: "Ξ", ticker: "ETH", balance: "1000.000", chip: "#ffffff", fg: "#10233d" },
];

const TABS = ["tabBuy", "tabSell", "tabWithdraw"];

/** Silent switch, volume pair, power — measured down the 600px body. */
const BUTTONS = [
  { side: "left", top: 122, height: 24 },
  { side: "left", top: 168, height: 46 },
  { side: "left", top: 222, height: 46 },
  { side: "right", top: 182, height: 64 },
] as const;

/** Cyan rim light, kept ahead of the drop shadow so it sits closest to the body. */
const BEZEL_GLOW = "0 0 0 1px rgb(56 173 253 / 0.4), 0 0 30px rgb(56 173 253 / 0.22)";

/**
 * Price cards floating over the device.
 *
 * `lg` and up only. They used to double as filler inside the screen on mobile,
 * where there was no room beside a 300px phone — but the screen is now a full app
 * view with nothing spare to sit in, so below `lg` they are simply dropped.
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
    box: "top-[196px] -left-24 w-[330px] h-[74px]",
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
    box: "top-[276px] -left-13 w-[330px] h-[68px]",
    duration: "7.5s",
    reverse: true,
  },
];

/** Label above, bordered control below — the form's only row primitive. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-[9.5px] leading-none font-medium text-phone-fg/58">{label}</div>
      <div className="flex h-8.5 items-center gap-1.5 overflow-hidden rounded-[10px] border border-phone-field-line bg-phone-field pl-2.5 text-[10.5px] font-semibold">
        {children}
      </div>
    </div>
  );
}

export function PhoneMockup({
  phoneRef,
  bezelRef,
}: {
  phoneRef: RefObject<HTMLDivElement | null>;
  bezelRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLang();
  const app = (key: string) => t(`hero.phoneApp.${key}`);

  return (
    // Fixed 300x600 at every breakpoint: the screen's type scale (9-15px) and its
    // fixed row heights are all tuned to that width, so reflowing the device is not
    // an option — under 360px it is uniformly scaled down instead, with a negative
    // margin taking back the 12% of height the scale no longer occupies. Below that
    // width the 300px body plus its side buttons was being clipped by the stage.
    //
    // `scale-*` is safe here even though the scroll handler owns `transform` on this
    // element: Tailwind v4 compiles it to the standalone `scale` property, and the
    // handler only ever runs at `lg` and up, where this variant does not apply.
    <div
      ref={phoneRef}
      data-hero-phone
      className="relative z-7 mx-auto h-150 w-75 origin-top max-[359px]:-mb-18 max-[359px]:scale-[0.88] lg:absolute lg:top-[calc(100%-334px)] lg:left-1/2 lg:mx-0"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Side buttons. Painted BEFORE the body and only 3.5px wide, so the frame
          covers all but the sliver that clears its edge — which is the whole
          trick: a button drawn fully outside the body reads as a sticker. */}
      {BUTTONS.map((button, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            top: button.top,
            height: button.height,
            width: 3.5,
            left: button.side === "left" ? -2.5 : undefined,
            right: button.side === "right" ? -2.5 : undefined,
            background: "var(--phone-rail)",
            borderRadius: button.side === "left" ? "3px 0 0 3px" : "0 3px 3px 0",
            boxShadow: "0 1px 2px rgb(0 0 0 / 0.5)",
          }}
        />
      ))}

      {/* Body. The mask fades the phone's bottom into the hero on first paint;
          the scroll handler removes it once the phone starts travelling — which
          is why the rail, not a wrapper, carries the ref: everything that has to
          fade has to be inside the masked element. */}
      <div
        ref={bezelRef}
        data-hero-bezel
        className="absolute inset-0 rounded-[44px]"
        style={{
          background: "var(--phone-rail)",
          boxShadow: `${BEZEL_GLOW}, var(--phone-drop), var(--phone-rail-edge)`,
        }}
      >
        {/* Graphite bezel between the rail and the glass. Without this middle
            layer the metal butts straight up against the UI and the device
            loses its thickness. */}
        <div
          className="absolute inset-[3px] rounded-[41px] bg-phone-bezel"
          style={{ boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.055)" }}
        >
          <div
            className="absolute inset-1 flex flex-col overflow-hidden rounded-[37px] text-phone-fg"
            style={{ background: "var(--phone-screen)" }}
          >
            {/* Status bar. Its two halves clear the island by geometry — the time
                ends around 50px and the icons start around 230px, the island
                spans 108-178. */}
            <div className="flex h-9 shrink-0 items-center justify-between px-4.5 pt-1 text-[9.5px] font-semibold">
              <div>{t("hero.phoneTime")}</div>
              <div aria-hidden className="flex items-center gap-1 opacity-85">
                <Wifi size={10} strokeWidth={2.4} />
                <SignalHigh size={10} strokeWidth={2.4} />
                <BatteryFull size={13} strokeWidth={2} />
              </div>
            </div>

            {/* Island + lens */}
            <span
              aria-hidden
              className="absolute top-2 left-1/2 flex! h-5.25 w-17.5 -translate-x-1/2 items-center justify-end rounded-full bg-phone-notch pr-2"
            >
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: "radial-gradient(circle at 32% 28%, #2f4d6e 0%, #070e18 72%)" }}
              />
            </span>

            {/* App bar — the wordmark is the white-lettering asset, not the
                theme-swapped <Logo />: the screen is dark in both themes. */}
            <div className="flex shrink-0 items-center justify-between px-4">
              <LayoutGrid
                size={15}
                strokeWidth={2.2}
                className="text-primary"
                aria-label={app("menu")}
              />
              <Image
                src="/assets/logo/web_logo.png"
                alt={t("brand.name")}
                width={1350}
                height={361}
                className="w-21"
              />
              <CircleUserRound
                size={17}
                strokeWidth={1.9}
                className="text-phone-fg/70"
                aria-label={app("account")}
              />
            </div>

            {/* Balance carousel. Deliberately overflowing: the second card is cut
                by the screen edge, which is what makes it read as swipeable. */}
            <div className="mt-3 flex shrink-0 gap-2.5 pl-4">
              {CARDS.map((card) => (
                <div
                  key={card.key}
                  className="w-42 shrink-0 rounded-[14px] border border-phone-border bg-phone-surface px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex! h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]! font-bold"
                      style={{ background: card.chip, color: card.fg }}
                    >
                      {card.glyph}
                    </span>
                    <span className="truncate text-[10.5px]! text-phone-fg/78">
                      {t(`hero.phoneCoin.${card.key}`)}
                    </span>
                  </div>
                  <div className="mt-2 text-[15px] leading-none font-bold tracking-[-0.01em]">
                    {/* `font-bold` is needed on the span itself: the base rule sets
                        spans to 500 and the phone's override only inherits size and
                        colour, so the ticker would otherwise be lighter than the
                        number it sits next to. */}
                    {card.balance}{" "}
                    <span className="inline! font-bold text-primary">{card.ticker}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mode tabs. `shrink-0` on each keeps the third one clipping at the
                screen edge instead of squeezing all three into 286px. */}
            <div className="mt-4 flex shrink-0 items-end gap-4 border-b border-phone-field-line px-4 text-[10.5px] font-semibold whitespace-nowrap">
              {TABS.map((tab, i) => (
                <div
                  key={tab}
                  className={`relative shrink-0 pb-1.5 ${i === 0 ? "text-primary" : "text-phone-fg/65"}`}
                >
                  {app(tab)}
                  {i === 0 && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Wallet scope */}
            <div className="mt-3.5 flex shrink-0 justify-center gap-2 px-4 text-[10px] font-semibold">
              <div className="rounded-[9px] bg-primary px-3.5 py-1.5 text-white">
                {app("insideWallet")}
              </div>
              <div className="rounded-[9px] border border-phone-border px-3.5 py-1.5 text-phone-fg/88">
                {app("outsideWallet")}
              </div>
            </div>

            {/* Form */}
            <div className="mt-4 grid shrink-0 grid-cols-2 gap-2.5 px-4">
              <Field label={app("selectCoin")}>
                <span
                  aria-hidden
                  className="flex! h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#26a17b] text-[9px]! font-bold text-white"
                >
                  {"₮"}
                </span>
                <span className="truncate">USDT</span>
                <ChevronDown size={13} className="mr-2 ml-auto shrink-0 opacity-55" aria-hidden />
              </Field>
              <Field label={app("selectNetwork")}>
                <span className="truncate">BSC</span>
                <ChevronDown size={13} className="mr-2 ml-auto shrink-0 opacity-55" aria-hidden />
              </Field>
            </div>

            <div className="mt-3 shrink-0 px-4">
              <Field label={app("paymentMethod")}>
                <span className="truncate font-medium! text-phone-fg/42">
                  {app("paymentPlaceholder")}
                </span>
                <ChevronDown size={13} className="mr-2 ml-auto shrink-0 opacity-55" aria-hidden />
              </Field>
            </div>

            {/* Amount. The USDT chip is `self-stretch` inside the field, so it
                takes the control's full height and is clipped to its radius. */}
            <div className="mt-3 shrink-0 px-4">
              <Field label={app("amount")}>
                <span className="truncate font-medium! text-phone-fg/42">
                  {app("amountPlaceholder")}
                </span>
                <div className="ml-auto flex shrink-0 items-center self-stretch bg-primary px-3 text-[10px] font-semibold text-white">
                  USDT
                </div>
              </Field>
            </div>

            <div className="mt-2.5 shrink-0 px-4 text-[9px] leading-[1.75] font-semibold text-primary">
              <div>{app("minAmount")}</div>
              <div>{app("rate")}</div>
            </div>

            {/* Primary CTA, pinned to the bottom of the screen */}
            <div className="mx-4 mt-auto mb-5 flex h-10.5 shrink-0 items-center justify-center rounded-[11px] bg-primary text-[12.5px] font-semibold text-white">
              {app("continue")}
            </div>

            {/* Glass sheen, over the UI but under nothing — last child so it wins
                the stacking order without needing a z-index. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[37px]"
              style={{ background: "var(--phone-gloss)" }}
            />
          </div>
        </div>
      </div>

      {FLOATING.map((coin) => (
        <div
          key={coin.key}
          className={`absolute hidden items-center gap-3 rounded-[20px] border border-card-line bg-card-glass px-4.5 text-card-fg shadow-float backdrop-blur-[14px] lg:flex ${coin.box}`}
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
