"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";
import { Play } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";

/**
 * Inlined rather than taken from lucide: its `Apple` icon is a piece of fruit,
 * which on an App Store button reads as a mistake.
 */
function AppleMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/**
 * Loop-arrow doodle sitting beside the headline, curling down to point at the
 * accent phrase — a hand-drawn accent rather than a functional icon.
 */
function LoopArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden>
      <path
        d="M52 18c24-14 56-2 54 20-2 20-30 26-42 12"
        stroke="rgb(var(--primary__color))"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M64 50c-10 10-22 20-38 26"
        stroke="rgb(var(--primary__color))"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M9 60l-3 18 19 3"
        stroke="rgb(var(--primary__color))"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Placeholder store fronts until AdCrypto has real listing URLs — swap these
// for the actual Play Store / App Store product pages once published.
const STORES = [
  {
    key: "android",
    href: "https://play.google.com/store",
    mark: (s: number) => <Play size={s} aria-hidden />,
  },
  {
    key: "apple",
    href: "https://www.apple.com/app-store/",
    mark: (s: number) => <AppleMark size={s} />,
  },
] as const;

export function DownloadApp() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      {/* Bloom sitting behind the device art, so the cut-out phones read as lit
          rather than pasted onto a flat panel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-0 h-[560px] w-[560px] -translate-y-1/2 blur-3xl lg:h-170 lg:w-170"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--primary__color) / 0.18), transparent 72%)",
        }}
      />

      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ---------------- Copy ---------------- */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <h2 className="text-[32px]! leading-[1.15]! font-extrabold tracking-tight sm:text-[38px]! lg:text-[44px]!">
                {t("download.headingLead")}{" "}
                <span className="text-primary!">{t("download.headingAccent")}</span>
              </h2>
              <LoopArrow className="pointer-events-none absolute -top-2 left-full ml-2 hidden h-20 w-24 sm:block" />
            </div>

            <p className="mt-4 max-w-110 text-body/70">{t("download.subtitle")}</p>

            {/* Ghost pill linking down to the How-It-Works panel higher on the
                page — a lavender tint plus a white play-disc, matching the
                reference rather than a solid CTA that would compete with the
                store badges below. */}
            <Link
              href="#how-it-works"
              className="mt-6 inline-flex! items-center gap-2.5 rounded-full bg-primary/10 py-1.5 pr-5 pl-1.5 text-[14px] font-semibold text-primary transition hover:bg-primary/15"
            >
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <Play size={13} fill="currentColor" />
              </span>
              {t("download.howItWorks")}
            </Link>

            {/* Store badges: full pill, black, side by side. Hovering reveals a
                QR panel encoding that same store link, so a desktop visitor
                can scan straight to their phone. */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {STORES.map((store) => {
                return (
                  <div key={store.key} className="group relative">
                    <div
                      className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max -translate-x-1/2 scale-95 rounded-2xl bg-surface p-3 text-center opacity-0 shadow-xl ring-1 ring-border transition duration-200 group-hover:scale-100 group-hover:opacity-100"
                      aria-hidden
                    >
                      <QRCode
                        value={store.href}
                        size={104}
                        bgColor="transparent"
                        fgColor="rgb(var(--heading))"
                      />
                      <span className="mt-1.5 block! text-[11px] text-muted">
                        {t("download.qrCaption")}
                      </span>
                      <span className="absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-surface ring-1 ring-border" />
                    </div>

                    <Link
                      href={store.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex! items-center gap-3 rounded-full bg-hero-badge px-6 py-3.5 text-white transition duration-200 hover:-translate-y-0.5 hover:text-white"
                    >
                      <span className="shrink-0">{store.mark(22)}</span>
                      <span className="block!">
                        <span className="block text-[10.5px] leading-tight tracking-wide text-white/60 uppercase">
                          {t(`download.stores.${store.key}.label`)}
                        </span>
                        <span className="block text-[15px] leading-tight font-semibold text-white">
                          {t(`download.stores.${store.key}.name`)}
                        </span>
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- Device art ---------------- */}
          <div className="relative order-1 mx-auto w-full max-w-130 lg:order-2 lg:mx-0">
            {/* Concentric arc echoing the dotted ring inside the artwork. */}
            <span
              aria-hidden
              className="absolute -inset-6 hidden rounded-full border border-primary/10 lg:block"
            />
            <Image
              src="/assets/download/download-app.webp"
              alt={t("download.imageAlt")}
              width={557}
              height={483}
              sizes="(min-width: 1024px) 520px, 100vw"
              className="relative w-full"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
