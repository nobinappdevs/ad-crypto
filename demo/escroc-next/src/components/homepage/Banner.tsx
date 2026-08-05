"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useSiteSectionData } from "@/hooks/useSiteData";
import { TOKEN_KEY } from "@/lib/axios";
import { savePendingEscrow, pendingEscrowUrl, type PendingEscrow } from "@/lib/pendingEscrow";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import Image from "next/image";
import bannerBg from '@public/assets/banner/bannerbg.webp'

function TypeWriter({
  words,
  typingSpeed = 90,
  deletingSpeed = 55,
  pauseMs = 1800,
}) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex % words.length];
    let timeout;
    if (!isDeleting) {
      if (text.length < word.length) {
        timeout = setTimeout(
          () => setText(word.slice(0, text.length + 1)),
          typingSpeed,
        );
      } else {
        timeout = setTimeout(() => setIsDeleting(true), pauseMs);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(
          () => setText(word.slice(0, text.length - 1)),
          deletingSpeed,
        );
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }, 0);
      }
    }
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseMs]);

  return (
    // Reserved, left-aligned width so the fixed text never shifts as the
    // word types in and out — only this slot grows/shrinks to the right.
    <span className="inline-block min-w-[2.7em] text-left align-baseline text-primary text-4xl sm:text-[65px] font-black tracking-tight leading-[1.1]">
      {text}
      <span
        aria-hidden
        className="ml-0.5 inline-block text-4xl sm:text-[65px] animate-pulse font-thin opacity-60"
      >
        |
      </span>
    </span>
  );
}

// Static fallback used only until the real currency list loads.
const FALLBACK_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", type: "FIAT", flagUrl: "" },
];

/* Currency chip — same shared Select used by the dashboard's WalletDropdown
   (search box + FIAT/CRYPTO badge + flag), instead of a bespoke dropdown. */
function CurrencySelect({ value, onChange, currencies }) {
  const { t } = useLang();
  const list = currencies.length ? currencies : FALLBACK_CURRENCIES;
  const options: SelectOption[] = list.map((c) => ({
    value: c.code,
    label: c.code,
    badge: c.type,
    sub: c.name,
    image: c.flagUrl || undefined,
    imageFallback: (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {c.symbol}
      </span>
    ),
    keywords: `${c.code} ${c.name} ${c.type ?? ""}`,
  }));
  return <Select variant="chip" value={value} onChange={onChange} options={options} menuGap={25} aria-label={t("banner.currencyAria")} />;
}


export function Banner() {
  const { t } = useLang();
  const router = useRouter();
  const { data: siteRes } = useSiteSectionData();
  const siteData = siteRes?.data;

  const currencies = (siteData?.currencies ?? []).map((c) => ({
    code: c.code,
    symbol: c.symbol,
    name: c.name,
    type: c.type,
    flagUrl: c.flag ? `${siteData.base_url}${siteData.currency_image_path}/${c.flag}` : "",
  }));

  const [type, setType] = useState("selling");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState("USD");

  const currentSymbol =
    currencies.find((c) => c.code === currency)?.symbol || "$";

  function handleSubmit(e) {
    e.preventDefault();
    // "Selling" → I'm the seller; "Buying" → I'm the buyer.
    const data: PendingEscrow = {
      role: type === "selling" ? "seller" : "buyer",
      title: item,
      amount,
      escrow_currency: currency,
    };
    const authed = typeof window !== "undefined" && Boolean(window.localStorage.getItem(TOKEN_KEY));
    if (authed) {
      // Signed in → straight to create-escrow with the data in the URL.
      router.push(pendingEscrowUrl(data));
    } else {
      // Signed out → stash the data, log in, then get forwarded to create-escrow.
      savePendingEscrow(data);
      router.push("/login");
    }
  }

  return (
    <section
      id="home"
      className="relative isolate flex min-h-[90vh] items-center overflow-hidden bg-bg/95"
    >
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-[-10%] -z-10 h-md w-md animate-pulse rounded-full bg-primary/20 blur-[140px]"
      />

      {/* Giant watermark — ESCROC wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2  -translate-y-1/2 select-none hidden lg:flex justify-center overflow-hidden"
      >
        <Image
          src={bannerBg}
          alt="bannerbg"
          className="w-[min(1400px,94%)] max-w-none opacity-[0.1] dark:opacity-[0.09]"
        />
      </div>

      {/* ── Top-left decoration (xl only) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-8 top-16 hidden select-none xl:block"
      >
        <div className="relative top-15 h-48 w-48">
          <div className="absolute inset-0 rounded-full border border-primary/16" />
          <div className="absolute inset-6 rounded-full border border-primary/12" />
          <div className="absolute inset-12 rounded-full border border-primary/10" />
          <div className="absolute inset-16 rounded-full bg-primary/8 blur-sm" />
        </div>
      </div>

      {/* ── Top-right decoration (xl only) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-20 hidden select-none xl:flex xl:flex-col xl:items-end"
      >
        {/* Dot grid */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-1 rounded-full bg-primary"
              style={{ opacity: 0.04 + (i % 6) * 0.025 }}
            />
          ))}
        </div>
      </div>

       <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-20 sm:px-6">
        {/* ---------- Centered intro ---------- */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Enhanced Pill Badge */}
          <span className="inline-flex items-center gap-2 rounded-full  bg-linear-to-r from-primary/15 to-transparent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary ">
            {t("banner.eyebrow")}
          </span>

          {/* Premium Gradient Title */}
          <h1 className="mt-4 text-4xl sm:text-[65px] font-black tracking-tight leading-[1.1] text-heading max-w-5xl">
            {t("banner.title")}{" "}
            <span className="inline-block text-primary whitespace-nowrap">
              <TypeWriter words={["Buy", "Sell"]} />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted/90 leading-relaxed">
            {t("banner.subtitle")}
          </p>
        </div>

        {/* Form */}
        <div className="relative mx-auto mt-14 max-w-6xl">
          <div className="absolute -inset-1 rounded-4xl  opacity-70 transition duration-1000 group-hover:opacity-100" />

          <form
            onSubmit={handleSubmit}
            className="relative rounded-3xl border border-border/80 bg-card/60 p-5  backdrop-blur-xl sm:p-6"
          >
            {/* Form header — a full sentence, so it reads as a normal heading +
                caption stack rather than a short uppercase eyebrow + pill badge
                (which used to wrap into an ugly two-line blob on mobile). */}
            <div className="mb-6 flex flex-col gap-1.5 px-1">
              <p className="text-sm font-bold leading-snug text-heading/90 sm:text-base">
                {t("banner.card.title")}
              </p>
              <p className="text-xs leading-relaxed text-muted/80 sm:text-sm">
                {t("banner.card.subtitle")}
              </p>
            </div>

            {/* Fields with labels */}
            <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto_auto] lg:items-end">
              {/* Field 1: Transaction Type */}
              <div className="flex flex-col gap-1.5">
                <label className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted/60">
                  {t("banner.form.transactionType")}
                </label>
                {/* full width + equal-width buttons on mobile, so it lines up with
                    the fields below instead of floating as a small shrink-wrapped
                    pill; reverts to its natural compact width from lg up */}
                <div className="flex w-full rounded-2xl border border-border bg-surface/80 p-1 shadow-inner lg:inline-flex lg:w-auto lg:shrink-0">
                  {["selling", "buying"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setType(opt)}
                      className={`flex-1 cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold capitalize transition-all duration-200 lg:flex-none ${
                        type === opt
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-muted hover:text-heading"
                      }`}
                    >
                      {t(`banner.form.${opt}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Item / Service */}
              <div className="flex flex-col gap-1.5">
                <label className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted/60">
                  {t("banner.form.itemService")}
                </label>
                <div className="flex items-center rounded-2xl border border-border bg-surface/50 px-4 transition-all duration-300 focus-within:border-primary focus-within:bg-surface focus-within:shadow-lg focus-within:shadow-primary/5">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder={t("banner.form.itemPlaceholder")}
                    className="w-full bg-transparent py-3.5 text-sm font-medium text-body outline-none placeholder:text-muted/60"
                  />
                </div>
              </div>

              {/* Field 3: Amount & Currency — an explicit `h-12` (not just
                  padding-derived height) so the currency chip's `h-full` has a
                  definite height to resolve against, `overflow-hidden` so
                  nothing can render outside this one rounded pill, and the
                  amount side is `flex-1` (grows) while the chip stays
                  `shrink-0` (natural width) — previously a fixed-width input
                  next to an unconstrained chip made the two sides look like
                  separate, mismatched boxes instead of one unified control. */}
              <div className="min-w-0 flex flex-col gap-1.5">
                <label className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted/60">
                  {t("banner.form.amountCurrency")}
                </label>
                <div className="flex h-12 min-w-0 overflow-hidden rounded-2xl border border-border bg-surface/50 transition-all duration-300 focus-within:border-primary focus-within:bg-surface focus-within:shadow-lg focus-within:shadow-primary/5">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-4 pr-2">
                    <span className="shrink-0 text-base font-bold text-primary">
                      {currentSymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={t("banner.form.amountPlaceholder")}
                      className="min-w-0 w-full bg-transparent text-sm font-bold text-body outline-none placeholder:text-muted/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <CurrencySelect value={currency} onChange={setCurrency} currencies={currencies} />
                </div>
              </div>

              {/* Field 4: Submit */}
              <div className="flex flex-col gap-1.5">
                {/* Invisible label spacer — aligns button bottom with fields */}
                <span className="text-[11px] invisible select-none" aria-hidden>
                  ‎
                </span>
                <button
                  type="submit"
                  className="group inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-primary to-primary/90 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:opacity-95 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t("banner.form.submit")}
                  <ArrowRight size={18} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </button>
              </div>
            </div>
          </form>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs text-muted/80 px-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} strokeWidth={2} className="text-emerald-500" aria-hidden />
              {t("banner.trust.secured")}
            </span>
            <span className="hidden sm:inline h-1 w-1 rounded-full bg-border" />
            <span>
              <strong>250k+</strong> {t("banner.trust.verified")}
            </span>
            <span className="hidden sm:inline h-1 w-1 rounded-full bg-border" />
            <span>{t("banner.trust.noFees")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
