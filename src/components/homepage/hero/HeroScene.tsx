"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { ease, segment, STAGE_HEIGHT, useScrollProgress } from "@/hooks/useScrollProgress";
import { HeroNav } from "./HeroNav";
import { PhoneMockup } from "./PhoneMockup";
import { HowItWorksPanel } from "./HowItWorksPanel";

/**
 * Where the phone ends up, as a fraction of the 900px stage. Taken from the
 * design's -320px / -376px offsets on a 1440x900 canvas, kept proportional so
 * the travel still reads correctly on wider screens.
 */
const PHONE_TRAVEL_X = -0.222;
const PHONE_TRAVEL_Y = -0.418;
const PHONE_END_SCALE = 0.76;

const BEZEL_MASK = "linear-gradient(180deg, #000 68%, rgba(0,0,0,0.35) 88%, transparent 100%)";

const META_KEYS = ["hero.metaNoCard", "hero.metaWithdraw", "hero.metaFee"];

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

    if (panel) panel.style.transform = `translateY(${(100 * (1 - panelIn)).toFixed(2)}%)`;

    if (panelText) {
      panelText.style.transform = `translateY(${(44 * (1 - textIn)).toFixed(1)}px)`;
      panelText.style.opacity = textIn.toFixed(3);
    }

    if (phone) {
      const stage = stageRef.current;
      const width = stage?.offsetWidth ?? 1440;
      const dx = PHONE_TRAVEL_X * width * travel;
      const dy = PHONE_TRAVEL_Y * STAGE_HEIGHT * travel;
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
    // The scroll runway and the stage are BOTH fixed pixel heights (2250 =
    // 2.5 x 900). Nothing here is derived from viewport height, so the
    // composition is identical on a 720px laptop and a 1440px monitor.
    <div ref={sceneRef} data-hero-scene className="relative bg-hero-bg lg:h-[2250px]">
      {/* Rendered OUTSIDE the hero layer on purpose: that layer carries a
          transform/will-change, which would make this `fixed` bar position
          against it instead of the viewport (and fade out with it). */}
      <HeroNav />

      <div className="lg:sticky lg:top-0 lg:h-[900px] lg:overflow-hidden">
        <div ref={stageRef} className="relative overflow-hidden lg:h-[900px]">
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
            {/* Corner accents live inside a centred 1440px frame — the design's
                canvas width. Anchoring them to the viewport instead makes them
                drift out to the edges on wide screens. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 mx-auto hidden h-full max-w-[1440px] lg:block"
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
            <div className="relative z-[3] mx-auto flex w-full max-w-[900px] flex-col items-center px-5 pt-24 pb-10 text-center sm:px-8 sm:pt-28 lg:absolute lg:top-37 lg:left-1/2 lg:w-215 lg:max-w-none lg:-translate-x-1/2 lg:px-0 lg:pt-0 lg:pb-0 xl:w-225">
              <span className="mb-5 inline-flex! items-center gap-2 rounded-full border border-hero-border bg-hero-surface py-1 pr-3.5 pl-1 text-[12.5px] font-semibold text-hero-fg lg:mb-[26px]">
                <span
                  aria-hidden
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-hero-accent text-[12px] font-bold text-white"
                >
                  $
                </span>
                {t("hero.badge")}
              </span>

              <h1 className="text-[28px]! leading-[1.1]! font-bold tracking-[-0.03em] text-hero-fg sm:text-[38px]! md:text-[46px]! lg:text-[52px]! lg:tracking-[-0.035em] xl:text-[62px]!">
                {t("hero.title")}
              </h1>

              <p className="mt-4 max-w-[530px] text-[14px]! leading-relaxed! text-hero-fg-soft sm:text-[15px]! lg:mt-[22px] lg:text-[16px]!">
                {t("hero.subtitle")}
              </p>

              <div className="mt-7 flex items-center gap-2.5 lg:mt-8">
                <Link
                  href="/login"
                  className="inline-flex! h-11 items-center rounded-full bg-hero-cta-bg px-6 text-[14px] font-semibold text-hero-cta-fg shadow-lg transition duration-200 hover:-translate-y-0.5 hover:text-hero-cta-fg sm:h-12 sm:px-7 sm:text-[15px]"
                >
                  {t("hero.ctaPrimary")}
                </Link>
                <Link
                  href="/about"
                  aria-label={t("hero.ctaIconLabel")}
                  className="inline-flex! h-11 w-11 items-center justify-center rounded-full border border-hero-border bg-hero-surface text-hero-fg transition duration-200 hover:bg-hero-surface-strong hover:text-hero-fg sm:h-12 sm:w-12"
                >
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-hero-fg-muted sm:text-[12.5px] lg:mt-[18px] lg:gap-x-[18px]">
                {META_KEYS.map((key, i) => (
                  <span key={key} className="inline-flex! items-center gap-x-4 lg:gap-x-[18px]">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="hidden h-[3px] w-[3px] rounded-full bg-hero-fg-muted opacity-50 sm:block"
                      />
                    )}
                    <span className="inline!">{t(key)}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Oversized wordmark. The gradient is clipped to the glyphs so it
                fades out toward the bottom in both themes. `relative z-[2]` is
                required: on mobile this is in normal flow, so without it the
                absolutely-positioned edge fade above would paint over it. */}
            <div
              aria-hidden
              className="pointer-events-none relative z-2 mt-6 w-full text-center text-[clamp(60px,18vw,270px)] leading-none font-bold tracking-[-0.045em] whitespace-nowrap select-none lg:absolute lg:-bottom-8.5 lg:left-0 lg:mt-0"
              style={{
                backgroundImage: "var(--hero-wordmark)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
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
          <div
            ref={hintRef}
            className="absolute bottom-6 left-5 z-[8] hidden items-center gap-2.5 text-[12px] tracking-[0.14em] text-hero-fg-muted uppercase lg:flex xl:left-14"
          >
            <span className="inline!">{t("hero.scroll")}</span>
            <span
              aria-hidden
              className="h-px w-[34px]"
              style={{
                background: "linear-gradient(90deg, rgb(var(--hero-fg-muted)), transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
