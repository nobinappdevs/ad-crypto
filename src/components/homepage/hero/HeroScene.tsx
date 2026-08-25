"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { ease, segment, useScrollProgress } from "@/hooks/useScrollProgress";
import { SHELL, SHELL_MAX } from "@/components/share/Container";
import { PhoneMockup } from "./PhoneMockup";
import { HowItWorksPanel } from "./HowItWorksPanel";

/**
 * Where the phone ends up. X is a fraction of stage width, so the travel stays
 * proportional. Y cannot be — the phone starts at `100% - PHONE_BOTTOM_OFFSET`, so
 * it is solved from the destination (`PHONE_END_Y`, measured from the stage top).
 */
const PHONE_TRAVEL_X = -0.222;
const PHONE_BOTTOM_OFFSET = 334;
const PHONE_END_Y = 190;
const PHONE_END_SCALE = 0.76;

/**
 * The cap on the phone's travel — `SHELL_MAX` as a number, since the travel is
 * computed. Both halves of the composition stop spreading at the same width.
 */
const HERO_FRAME = 1292;

const BEZEL_MASK = "linear-gradient(180deg, #000 68%, rgba(0,0,0,0.35) 88%, transparent 100%)";

export function HeroScene() {
  const { t } = useLang();

  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelTextRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const bezelRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const apply = useCallback((p: number, isDesktop: boolean) => {
    const hero = heroRef.current;
    const panel = panelRef.current;
    const panelText = panelTextRef.current;
    const phone = phoneRef.current;
    const bezel = bezelRef.current;
    const hint = hintRef.current;

    // Below `lg` the scene is a plain stacked layout — drop every inline
    // transform so the CSS classes are the only thing positioning it.
    if (!isDesktop) {
      for (const el of [hero, panel, panelText, phone]) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
      }
      if (bezel) bezel.style.maskImage = "none";
      if (hint) hint.style.opacity = "";
      return;
    }

    const heroOut = ease(segment(p, 0.05, 0.4));
    const panelIn = ease(segment(p, 0.1, 0.58));
    const travel = ease(segment(p, 0.06, 0.62));
    const textIn = ease(segment(p, 0.34, 0.78));

    if (hero) {
      hero.style.transform = `translateY(${(-90 * heroOut).toFixed(1)}px)`;
      hero.style.opacity = (1 - heroOut).toFixed(3);
    }

    // `translate3d`, not `translateY`: both of these run every frame alongside the
    // phone, and the 2D form keeps them on the main thread's paint path.
    if (panel) panel.style.transform = `translate3d(0, ${(100 * (1 - panelIn)).toFixed(2)}%, 0)`;

    if (panelText) {
      panelText.style.transform = `translate3d(0, ${(44 * (1 - textIn)).toFixed(1)}px, 0)`;
      panelText.style.opacity = textIn.toFixed(3);
    }

    if (phone) {
      const stage = stageRef.current;
      const height = stage?.offsetHeight ?? 900;
      // Capped at the design canvas: past 1440px the phone holds its offset from
      // the centre instead of drifting further out with the window.
      const width = Math.min(stage?.offsetWidth ?? HERO_FRAME, HERO_FRAME);
      const dx = PHONE_TRAVEL_X * width * travel;
      // Distance from the phone's start (height - PHONE_BOTTOM_OFFSET) to its
      // destination (PHONE_END_Y). Re-derived from the live stage height every
      // frame, so a taller window doesn't push the end position off-screen.
      const dy = (PHONE_END_Y - (height - PHONE_BOTTOM_OFFSET)) * travel;
      const scale = 1 - (1 - PHONE_END_SCALE) * travel;
      phone.style.transform = `translate3d(calc(-50% + ${dx.toFixed(2)}px), ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      // Once the phone lifts off the hero it sits on the panel, where the
      // bottom fade would read as a rendering glitch.
      if (bezel) bezel.style.maskImage = travel > 0.03 ? "none" : BEZEL_MASK;
    }

    if (hint) hint.style.opacity = (1 - ease(segment(p, 0.02, 0.18))).toFixed(3);
  }, []);

  useScrollProgress(sceneRef, apply);

  return (
    // 2500px of scroll runway, but the stage is one VIEWPORT tall — at a fixed
    // height a taller window left a dead band under the phone.
    <div ref={sceneRef} data-hero-scene className="relative bg-hero-bg  lg:h-[2500px]">
      {/* The floor is set by the copy block: centred inside `100% - 470px`, and the
          headline stack needs ~400px. On a shorter window the sticky element is
          taller than the viewport, so the scene scrolls a little before pinning. */}
      <div className="lg:sticky lg:top-0  lg:h-screen lg:min-h-220 lg:overflow-hidden">
        <div
          ref={stageRef}
          className="relative overflow-hidden lg:h-screen lg:min-h-220"
        >
          {/* ---------------- Hero layer ---------------- */}
          <div
            ref={heroRef}
            className="relative z-[2] lg:absolute lg:inset-0"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Layered glow stack, in the reference design's order:
                base -> brand glow -> soft halo -> vignette -> two corner
                accents -> vertical edge fade. */}
            <div aria-hidden className="absolute inset-0 bg-hero-bg" />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-[240px] left-1/2 h-[720px] w-[820px] -translate-x-1/2 blur-[3px] sm:-top-[320px] sm:h-[900px] sm:w-[1080px] lg:-top-[460px] lg:h-[1180px] lg:w-[1520px]"
              style={{ background: "var(--hero-glow)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-[150px] left-1/2 h-[520px] w-[640px] -translate-x-1/2 blur-[30px] sm:-top-[200px] sm:h-[660px] sm:w-[780px] lg:-top-[260px] lg:h-[820px] lg:w-[980px]"
              style={{ background: "var(--hero-halo)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-[90px] left-1/2 h-[480px] w-[680px] -translate-x-1/2 lg:-top-[140px] lg:h-[720px] lg:w-[1000px]"
              style={{ background: "var(--hero-vignette)" }}
            />
            {/* Corner accents live inside the page shell — the design's canvas
                width. Anchoring them to the viewport instead makes them drift out
                to the edges on wide screens. */}
            <div
              aria-hidden
              className={`${SHELL_MAX} pointer-events-none absolute inset-x-0 top-0 hidden h-full lg:block`}
            >
              <div
                data-glow="left"
                className="absolute top-10 left-[60px] h-[400px] w-[440px] rounded-full blur-[40px]"
                style={{ background: "var(--hero-spot)" }}
              />
              <div
                data-glow="right"
                className="absolute top-[150px] right-5 h-[420px] w-[420px] rounded-full blur-[46px]"
                style={{ background: "var(--hero-spot-2)" }}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "var(--hero-edge)" }}
            />

            {/* pt clears the fixed nav on mobile, where it is out of flow. */}
            {/* Centred in the band between the nav and the phone, not pinned to a
                fixed `top` — the stage is viewport-height. 470 = the phone's bottom
                offset plus clearance. */}
            <div className="relative z-[3] mx-auto flex w-full max-w-[900px] flex-col items-center px-5 pt-24 pb-10 text-center sm:px-8 sm:pt-28 lg:absolute lg:top-22 lg:left-1/2 lg:h-[calc(100%-470px)] lg:w-215 lg:max-w-none lg:-translate-x-1/2 lg:justify-center lg:px-0 lg:pt-0 lg:pb-0 xl:w-225">
              {/* <div className="relative inline-flex items-center my-4">
      <div className="relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary">
          <DollarSign className="h-4 w-4 stroke-[3]" />
        </div>
      </div>
      <div className="-ml-5 flex h-9 items-center rounded-full bg-hero-badge pl-8 pr-5 text-sm font-semibold text-white tracking-wide shadow-inner">
       {t("hero.badge")}
      </div>
    </div> */}

              <h1 className="text-[28px]! leading-[1.1]! font-bold tracking-[-0.03em] text-hero-fg sm:text-[38px]! md:text-[46px]! lg:text-[52px]! lg:tracking-[-0.035em] xl:text-[62px]!">
                {t("hero.title")}
              </h1>

              <p className="mt-4 max-w-[530px] text-[14px]! leading-relaxed! text-hero-fg-soft sm:text-[15px]! lg:mt-[22px] lg:text-[16px]!">
                {t("hero.subtitle")}
              </p>

              <div className="mt-7 flex items-center gap-2.5 lg:mt-8">
                <Link
                  href="/login"
                  className="btn-lift inline-flex! h-11 items-center rounded-full bg-hero-cta-bg px-6 text-[14px] font-semibold text-hero-cta-fg [--btn-glow:var(--hero-cta-bg)] hover:text-hero-cta-fg sm:h-12 sm:px-7 sm:text-[15px]"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/about"
                  aria-label={t("hero.ctaIconLabel")}
                  className="inline-flex! h-11 w-11 items-center justify-center rounded-full border border-hero-cta-ring bg-hero-cta-ring-bg text-hero-fg transition duration-200 hover:bg-hero-surface-strong hover:text-hero-fg sm:h-12 sm:w-12"
                >
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>


            </div>

            {/* Oversized wordmark, masked so it fades toward the bottom. `relative
                z-[2]` is required or the edge fade above paints over it. */}
            <div
              aria-hidden
              // Wall to wall, cropping at both edges. A SOLID colour at 50% with a
              // downward mask, not a clipped gradient — the mask fades the glyphs
              // without fading the colour, so both themes match.
              className="pointer-events-none relative z-2 mt-6 w-full text-center text-[clamp(64px,16vw,230px)] leading-none font-medium tracking-[0.03em] whitespace-nowrap text-hero-wordmark opacity-50 select-none lg:absolute lg:bottom-5.5 lg:left-0 lg:mt-0"
              style={{
                maskImage:
                  "linear-gradient(180deg, rgb(0 0 0 / 0.8) 24%, rgb(0 0 0 / 0.4) 74%, rgb(0 0 0 / 0.1) 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, rgb(0 0 0 / 0.8) 24%, rgb(0 0 0 / 0.4) 74%, rgb(0 0 0 / 0.1) 100%)",
              }}
            >
              {t("brand.name")}
            </div>
          </div>

          {/* Phone first so the mobile stack reads hero -> phone -> steps. On
              desktop both layers are absolute, so z-index (7 vs 4) decides
              that the phone rides above the panel. */}
          <PhoneMockup phoneRef={phoneRef} bezelRef={bezelRef} />

          <HowItWorksPanel panelRef={panelRef} textRef={panelTextRef} />

          {/* ---------------- Scroll hint ---------------- */}
          {/* Shelled like everything else, so it starts on the same left edge as
              the nav's first link rather than hugging the window. */}
          <div
            ref={hintRef}
            className={`${SHELL} absolute bottom-6 inset-x-0 z-[8] hidden lg:block`}
          >
            <span className="flex! items-center gap-2.5 text-[12px] tracking-[0.14em] text-hero-fg-muted uppercase">
              <span className="inline!">{t("hero.scroll")}</span>
              <span
                aria-hidden
                className="h-px w-[34px]"
                style={{
                  background: "linear-gradient(90deg, rgb(var(--hero-fg-muted)), transparent)",
                }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
