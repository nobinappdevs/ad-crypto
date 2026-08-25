"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useRef, type CSSProperties } from "react";
import { useLang } from "@/hooks/useLang";
import { useFitScale } from "@/hooks/useFitScale";
import { useReveal } from "@/hooks/useReveal";
import { SHELL } from "@/components/share/Container";

/**
 * An absolute composition on a fixed 1180x640 canvas — the overlap IS the design.
 * From `xl` up it renders at real size and scales; below, the pieces are rebuilt as
 * a stack with the tile and avatar as satellites of the phone.
 */
const STAGE_W = 1180;
const STAGE_H = 640;

const STORES = [
  {
    key: "apple",
    href: "https://www.apple.com/app-store/",
    labelKey: "download.stores.apple.name",
    path: "M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.6 2.2 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.8.7 1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1-1.8-.1 0-2-.8-2-3zM14 5.4c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z",
  },
  {
    key: "android",
    href: "https://play.google.com/store",
    labelKey: "download.stores.android.name",
    path: "M4 3.2v17.6c0 .5.5.8.9.6l9.3-5.4-2.6-2.6L4 3.2zM16.3 14.6l3.4-2c.5-.3.5-1 0-1.3l-3.3-1.9-2.7 2.6 2.6 2.6zM4.9 2.6l8.7 8.7 2.2-2.2L5.8 2.7c-.3-.2-.7-.2-.9-.1z",
  },
] as const;

/** Shared surface treatments, so the canvas and the stacked layout can't drift. */
const TILE_STYLE: CSSProperties = {
  background: "linear-gradient(158deg, #ffffff 0%, #f5faff 58%, #e6f1fb 100%)",
  boxShadow:
    "inset 0 2px 0 #ffffff, inset 0 -6px 14px rgb(9 30 60 / 0.1), 0 26px 50px rgb(1 20 40 / 0.32)",
};
const PHONE_SHADOW = "drop-shadow(0 40px 80px rgb(1 20 40 / 0.4))";
const AVATAR_SHADOW = "0 24px 46px rgb(1 20 40 / 0.32)";
const STORE_SHADOW = "0 16px 32px rgb(1 20 40 / 0.28)";

/** Currency mark inside the white tile — a coin, not a bare dollar sign. */
function CoinMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ stroke: "rgb(var(--primary__color))" }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.6 8.6h4.2a2.2 2.2 0 010 4.4H9.6h4.6a2.2 2.2 0 010 4.4H9.6" />
      <path d="M11 6.4v1.9M13.4 6.4v1.9M11 17.4v1.9M13.4 17.4v1.9" />
    </svg>
  );
}

function StoreButtons() {
  const { t } = useLang();

  return (
    <div className="flex flex-wrap gap-[14px]">
      {STORES.map((store) => (
        <div key={store.key} className="group relative">
          {/* Hover panel with the same store link as a QR. NOT theme-aware: a QR
              needs dark modules on a light field to scan. */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max -translate-x-1/2 scale-95 rounded-2xl bg-white p-3 text-center opacity-0 ring-1 ring-black/10 shadow-xl transition duration-200 group-hover:scale-100 group-hover:opacity-100"
          >
            <QRCode value={store.href} size={104} bgColor="#ffffff" fgColor="#091628" />
            <span className="mt-1.5 block! text-[11px]! text-[#64748b]">
              {t("download.qrCaption")}
            </span>
            <span className="absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-white ring-1 ring-black/10" />
          </div>

          <Link
            href={store.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex! items-center gap-[9px] rounded-full px-[22px] py-[13px] text-[14px]! font-semibold transition-opacity duration-300 hover:opacity-90"
            style={{
              background: "var(--suite-store-bg)",
              color: "var(--suite-store-fg)",
              boxShadow: STORE_SHADOW,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d={store.path} />
            </svg>
            {t(store.labelKey)}
          </Link>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

export function WelcomeApp() {
  const { t } = useLang();

  const sectionRef = useRef<HTMLElement>(null);
  // Staggered fade-up as the section arrives. Purely additive — every element
  // still lands on its designed coordinates.
  useReveal(sectionRef);

  const { attach, scale } = useFitScale(STAGE_W);

  const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-14 pb-16 sm:pt-16 sm:pb-20 xl:px-14 xl:pt-[70px] xl:pb-[90px]"
      // Flat, not --suite-bg: this section sits mid-run between Overview and the
      // footer, and the gradient restarts its white core inside every box it is
      // applied to — which is exactly the seam that showed at both boundaries.
      style={{ background: "var(--suite-bg-flat)" }}
    >
      {/* ================= Absolute canvas (xl and up) ================= */}
      <div ref={attach} className="hidden xl:block" style={{ height: STAGE_H * scale }}>
        <div
          className="relative mx-auto"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Concentric rings, cropped by the section — the scene's only backdrop. */}
          <div
            aria-hidden
            className="pointer-events-none absolute overflow-hidden"
            style={{ inset: "-90px -200px" }}
          >
            {/* Centred on the canvas: this wrapper is inset symmetrically, so its
                centre IS the canvas centre. */}
            <span
              className="absolute top-1/2 left-1/2 rounded-full"
              style={{
                width: 620,
                height: 620,
                transform: "translate(-50%, -50%)",
                background: "var(--suite-wm-fill)",
              }}
            />
            <span
              className="absolute rounded-full border"
              style={{
                left: 96,
                top: -60,
                width: 800,
                height: 800,
                borderColor: "var(--suite-wm-line)",
              }}
            />
            <span
              className="absolute rounded-full border"
              style={{
                left: -420,
                top: 90,
                width: 900,
                height: 900,
                borderColor: "var(--suite-wm-line)",
              }}
            />
            <span
              className="absolute rounded-full border"
              style={{
                right: -500,
                top: -180,
                width: 1000,
                height: 1000,
                borderColor: "var(--suite-wm-line)",
              }}
            />
          </div>

          {/* The second line is nudged right so the phone can sit in the notch it
              leaves — that indent is structural, not decorative. */}
          <h2
            data-reveal
            className="absolute z-[1] text-[80px]! leading-[0.98]! font-semibold! tracking-[-0.035em]"
            style={{ left: 200, top: 10, color: "var(--suite-fg)", ...delay(0) }}
          >
            <span className="block!">{t("welcome.headingLine1")}</span>
            {/* Padding, not a translate — a translate would push a longer line past
                the canvas edge, and it does not mirror in Arabic. */}
            <span className="block!" style={{ paddingInlineStart: 96 }}>
              {t("welcome.headingLine2Lead")}{" "}
              <span className="text-primary!">{t("welcome.headingLine2Accent")}</span>
            </span>
          </h2>

          <div
            data-reveal
            className="absolute z-[2] overflow-hidden grid! place-items-center"
            style={{
              left: 232,
              top: 258,
              width: 112,
              height: 112,
              borderRadius: 34,
              ...TILE_STYLE,
              ...delay(240),
            }}
          >
                   <Image
              src="/assets/download/aveter-two.webp"
              alt={t("welcome.avatarAlt")}
              width={700}
              height={966}
              className="h-full w-full object-cover"
            />
          </div>

          <div
            data-reveal
            className="absolute top-34! z-[3]"
            style={{ left: 396, top: 196, width: 440, filter: PHONE_SHADOW, ...delay(120) }}
          >
            <Image
              src="/assets/download/phonemokup.webp"
              alt={t("welcome.phoneAlt")}
              width={496}
              height={503}
              className="block w-full"
            />
          </div>

          <div
            data-reveal
            className="absolute z-[2] overflow-hidden"
            style={{
              left: 838,
              top: 274,
              width: 84,
              height: 84,
              borderRadius: 24,
              boxShadow: AVATAR_SHADOW,
              ...delay(320),
            }}
          >
            <Image
              src="/assets/download/aveter.webp"
              alt={t("welcome.avatarAlt")}
              width={700}
              height={966}
              className="h-full w-full object-cover"
            />
          </div>

          <div
            data-reveal
            className="absolute z-[2] text-[26px]! leading-[1.32]! font-medium! tracking-[-0.01em]"
            style={{ left: 34, top: 434, width: 250, color: "var(--suite-fg)", ...delay(400) }}
          >
            {t("welcome.tagline")}
          </div>

          {/* z-4, above the phone: the QR panel rises out of this block and the
              App Store button sits right on the phone's right edge, so at z-2 the
              panel's left side would be clipped behind the device. */}
          <div
            data-reveal
            className="absolute z-[4] flex flex-col"
            style={{ left: 830, top: 414, width: 320, gap: 22, ...delay(480) }}
          >
            <p className="text-[15px]! leading-[1.6]!" style={{ color: "var(--suite-card-muted)" }}>
              {t("welcome.text")}
            </p>
            <StoreButtons />
          </div>
        </div>
      </div>

      {/* ================= Stacked layout (below xl) ================= */}
      <div className={`${SHELL} xl:hidden`}>
        {/* Same three rings, sized off the section instead of the 1180px canvas. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <span
            className="absolute top-[4%] left-1/2 aspect-square w-[125%] -translate-x-1/2 rounded-full"
            style={{ background: "var(--suite-wm-fill)" }}
          />
          <span
            className="absolute top-[-8%] left-1/2 aspect-square w-[150%] -translate-x-1/2 rounded-full border"
            style={{ borderColor: "var(--suite-wm-line)" }}
          />
          <span
            className="absolute top-[18%] left-1/2 aspect-square w-[190%] -translate-x-1/2 rounded-full border"
            style={{ borderColor: "var(--suite-wm-line)" }}
          />
        </div>

        <div className="relative">
          <h2
            data-reveal
            className="text-center text-[clamp(40px,10.5vw,76px)]! leading-[0.98]! font-semibold! tracking-[-0.035em] wrap-break-word sm:text-left"
            style={{ color: "var(--suite-fg)", ...delay(0) }}
          >
            <span className="block!">{t("welcome.headingLine1")}</span>
            {/* `ps`, not `translate-x`: the translate pushed the tail of a longer
                line (es/fr/hi all run wider than "The AdCrypto App") outside the
                section, where `overflow-hidden` cropped it. */}
            <span className="block! sm:ps-[9%]">
              {t("welcome.headingLine2Lead")}{" "}
              <span className="text-primary!">{t("welcome.headingLine2Accent")}</span>
            </span>
          </h2>

          {/* The phone box is 64% of the row so the tile (-26%) and the avatar
              (+100%) still land inside the section at every width. */}
          <div data-reveal className="mt-10 sm:mt-12" style={delay(120)}>
            <div className="mx-auto w-full max-w-[520px]">
              <div className="relative mx-auto w-[64%]" style={{ filter: PHONE_SHADOW }}>
                <Image
                  src="/assets/download/phonemokup.webp"
                  alt={t("welcome.phoneAlt")}
                  width={496}
                  height={503}
                  className="block w-full"
                />

                <div
                  className="absolute top-[12%] -left-[26%] grid! aspect-square w-[25.5%] place-items-center rounded-[30%]"
                  style={TILE_STYLE}
                >
                  <CoinMark className="h-[41%] w-[41%]" />
                </div>

                <div
                  className="absolute top-[16%] -right-[19%] aspect-square w-[19%] overflow-hidden rounded-[28%]"
                  style={{ boxShadow: AVATAR_SHADOW }}
                >
                  <Image
                    src="/assets/download/aveter.webp"
                    alt={t("welcome.avatarAlt")}
                    width={700}
                    height={966}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 sm:items-end sm:gap-10">
            <div
              data-reveal
              className="text-[clamp(20px,5vw,26px)]! leading-[1.32]! font-medium! tracking-[-0.01em]"
              style={{ color: "var(--suite-fg)", ...delay(200) }}
            >
              {t("welcome.tagline")}
            </div>

            <div data-reveal className="flex flex-col gap-5" style={delay(280)}>
              <p className="text-[15px]! leading-[1.6]!" style={{ color: "var(--suite-card-muted)" }}>
                {t("welcome.text")}
              </p>
              <StoreButtons />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
