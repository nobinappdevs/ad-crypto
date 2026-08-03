"use client";

import type { RefObject } from "react";
import { useLang } from "@/hooks/useLang";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { SHELL, SHELL_MAX } from "@/components/share/Container";

const STEPS = [
  { num: "01", key: "onboarding" },
  { num: "02", key: "transactions" },
  { num: "03", key: "secure" },
];

export function HowItWorksPanel({
  panelRef,
  textRef,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  textRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useLang();

  return (
    <div
      ref={panelRef}
      id="how-it-works"
      data-hero-panel
      className="relative z-[4] overflow-hidden lg:absolute lg:inset-0"
      style={{ background: "var(--hero-panel-bg)", willChange: "transform" }}
    >
      {/* Ambient glows + the isometric grid floor from the design.
          All three live inside the page shell, unpadded: their offsets are
          measured from the canvas edge, and anchoring them to the viewport
          instead dragged them out to the window's left edge on wide screens
          while the phone stayed near the middle. */}
      <div aria-hidden className={`${SHELL_MAX} pointer-events-none absolute inset-0`}>
        <div
          className="absolute -top-36 left-5 h-[620px] w-[620px] rounded-full blur-[20px] lg:h-[820px] lg:w-[820px]"
          style={{ background: "var(--hero-panel-glow-a)" }}
        />
        <div
          className="absolute top-[520px] left-[70px] hidden h-[400px] w-[660px] lg:block"
          style={{
            backgroundImage:
              "linear-gradient(var(--hero-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--hero-grid-line) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            transform: "perspective(760px) rotateX(62deg) rotateZ(45deg)",
            maskImage: "radial-gradient(closest-side, #000 35%, transparent 78%)",
          }}
        />
        <div
          className="absolute top-[210px] left-[180px] hidden h-[440px] w-[440px] rounded-full blur-[12px] lg:block"
          style={{ background: "var(--hero-panel-glow-b)" }}
        />
      </div>

      {/* The page shell, so the copy ends exactly where the nav's CTA and every
          section's right edge end. The inner wrapper is what the copy anchors to:
          an absolutely-positioned child would otherwise measure from the shell's
          PADDING box and sit flush against the window's edge again. */}
      <div className={`${SHELL} relative lg:absolute lg:inset-0`}>
        <div className="relative lg:h-full">
          <div
            ref={textRef}
            // `right-0` is the shell's content edge, so the copy ends exactly where
            // the nav's CTA and every section below it end.
            //
            // The width is a fraction of the shell rather than the design's flat
            // 560px so the column tracks the frame between `lg` and its cap instead
            // of holding a desktop width down at 1024, where it used to come within
            // a couple of pixels of the phone.
            className="relative mx-auto w-full max-w-[620px] py-14 sm:py-16 lg:absolute lg:top-[120px] lg:right-0 lg:mx-0 lg:w-[45%] lg:max-w-none lg:py-0"
            style={{ willChange: "transform, opacity" }}
          >
            <SectionKicker className="my-4" textClassName="text-hero-fg-muted">
              {t("howItWorks.badge")}
            </SectionKicker>

            <h2 className="text-[26px]! leading-tight! font-bold tracking-tight text-hero-fg sm:text-[32px]! md:text-[38px]! lg:text-[38px]! xl:text-[44px]!">
              {t("howItWorks.titleLead")}{" "}
              <span className="text-hero-accent-soft!">{t("howItWorks.titleAccent")}</span>
            </h2>

            <p className="mt-4 max-w-120 text-[14px]! leading-relaxed! text-hero-fg-dim sm:text-[15.5px]!">
              {t("howItWorks.subtitle")}
            </p>

            <div className="relative mt-8 flex flex-col gap-6 lg:mt-8 lg:gap-6 xl:mt-10 xl:gap-7.5">
              {/* Dashed rail connecting the step medallions. */}
              <div
                aria-hidden
                // `inset-s`, not `left`: the element is 0 wide and draws its line with a
                // border, so anchoring it to the start edge puts the rail under the
                // medallions in both reading directions.
                className="absolute top-6 bottom-15 inset-s-[23px] border-l-[1.5px] border-dashed border-hero-accent-soft/55"
              />
              {STEPS.map((step) => (
                <div key={step.key} className="relative flex items-start gap-4 sm:gap-5.5">
                  <span
                    aria-hidden
                    // Gradient and glow both derive from --primary__color, so the
                    // medallions follow the brand colour instead of pinning indigo.
                    className="relative z-[2] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,rgb(var(--primary__color)),#0163a0)] text-[15px] font-bold text-white shadow-[0_10px_26px_rgb(var(--primary__color)/0.42)]"
                  >
                    {step.num}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-[17px]! leading-snug! font-bold tracking-tight text-hero-fg sm:text-[19px]! lg:text-[19px]! xl:text-[21px]!">
                      {t(`howItWorks.steps.${step.key}.title`)}
                    </h3>
                    <p className="mt-1.5 max-w-117.5 text-[13.5px]! leading-relaxed! text-hero-fg-dim sm:text-[14.5px]!">
                      {t(`howItWorks.steps.${step.key}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
