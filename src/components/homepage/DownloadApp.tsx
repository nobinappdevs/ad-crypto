"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Play, Star } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";

const HIGHLIGHT_KEYS = ["exchange", "wallets", "withdrawals"] as const;

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

const STORES = [
  { key: "android", mark: (s: number) => <Play size={s} aria-hidden /> },
  { key: "apple", mark: (s: number) => <AppleMark size={s} /> },
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
            <span className="inline-flex! items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3.5 pl-1 text-[12.5px] font-semibold text-heading">
              <span
                aria-hidden
                className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white"
              >
                $
              </span>
              {t("download.badge")}
            </span>

            <h2 className="mt-4">
              {t("download.headingLead")}{" "}
              <span className="text-primary!">{t("download.headingAccent")}</span>
            </h2>

            <p className="mt-4 max-w-140">{t("download.subtitle")}</p>

            <ul className="mt-7 flex flex-col gap-3">
              {HIGHLIGHT_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="inline! text-[13px] text-body md:text-[14px]">
                    {t(`download.highlights.${key}`)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Store buttons: stacked black pills, one platform mark and its
                two-line label per row — the vertical stack is what reads as
                a pair of store badges rather than a generic button row. */}
            <div className="mt-8 flex flex-col items-start gap-3.5">
              {STORES.map((store) => {
                return (
                  <Link
                    key={store.key}
                    href="#"
                    className="group inline-flex! items-center gap-3 rounded-full bg-hero-badge px-6 py-3.5 text-white transition duration-200 hover:-translate-y-0.5 hover:text-white"
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
                );
              })}
            </div>

            {/* Rating strip — cheap social proof, and it fills the space the QR
                blocks used to occupy without shipping an unscannable fake code. */}
            <div className="mt-6 flex items-center gap-3">
              <span aria-hidden className="flex items-center gap-0.5 text-primary">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className="fill-current" />
                ))}
              </span>
              <span className="inline! text-[13px] text-muted md:text-[13px]">
                {t("download.rating")}
              </span>
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
