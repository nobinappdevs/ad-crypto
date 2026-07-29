"use client";

import type { RefObject } from "react";
import { useLang } from "@/hooks/useLang";

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
      data-hero-panel
      className="relative z-[4] overflow-hidden lg:absolute lg:inset-0"
      style={{ background: "var(--hero-panel-bg)", willChange: "transform" }}
    >
      {/* Ambient glows + the isometric grid floor from the design. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-36 left-5 h-[620px] w-[620px] rounded-full blur-[20px] lg:h-[820px] lg:w-[820px]"
        style={{ background: "var(--hero-panel-glow-a)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[520px] left-[70px] hidden h-[400px] w-[660px] lg:block"
        style={{
          backgroundImage:
            "linear-gradient(var(--hero-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--hero-grid-line) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          transform: "perspective(760px) rotateX(62deg) rotateZ(45deg)",
          maskImage: "radial-gradient(closest-side, #000 35%, transparent 78%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[210px] left-[180px] hidden h-[440px] w-[440px] rounded-full blur-[12px] lg:block"
        style={{ background: "var(--hero-panel-glow-b)" }}
      />

      <div
        ref={textRef}
        className="relative mx-auto w-full max-w-[620px] px-5 py-14 sm:px-8 sm:py-16 lg:absolute lg:top-[120px] lg:right-[5%] lg:mx-0 lg:w-[580px] lg:max-w-none lg:px-0 lg:py-0 xl:right-[7%] xl:w-[600px]"
        style={{ willChange: "transform, opacity" }}
      >
        <span className="mb-5 inline-flex! items-center gap-2.5 rounded-full border border-hero-border bg-hero-surface py-1 pr-4 pl-1 text-[12.5px] font-semibold text-hero-fg">
          <span
            aria-hidden
            className="flex h-6 w-6 items-center justify-center rounded-full bg-hero-accent text-[11px] font-bold text-white"
          >
            $
          </span>
          {t("howItWorks.badge")}
        </span>

        <h2 className="text-[26px]! leading-tight! font-bold tracking-tight text-hero-fg sm:text-[32px]! md:text-[38px]! lg:text-[40px]! xl:text-[44px]!">
          {t("howItWorks.titleLead")}{" "}
          <span className="text-hero-accent-soft!">{t("howItWorks.titleAccent")}</span>
        </h2>

        <p className="mt-4 max-w-[500px] text-[14px]! leading-relaxed! text-hero-fg-soft sm:text-[15.5px]!">
          {t("howItWorks.subtitle")}
        </p>

        <div className="relative mt-8 flex flex-col gap-6 lg:mt-10 lg:gap-7.5">
          {/* Dashed rail connecting the step medallions. */}
          <div
            aria-hidden
            className="absolute top-6 bottom-14 left-[23px] border-l-[1.5px] border-dashed border-hero-accent-soft/55"
          />
          {STEPS.map((step) => (
            <div key={step.key} className="relative flex items-start gap-4 sm:gap-5.5">
              <span
                aria-hidden
                className="relative z-[2] flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#2f4bff,#4a34d8)] text-[15px] font-bold text-white shadow-[0_10px_26px_rgba(47,75,255,0.42)]"
              >
                {step.num}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-[17px]! leading-snug! font-bold tracking-tight text-hero-fg sm:text-[19px]! lg:text-[21px]!">
                  {t(`howItWorks.steps.${step.key}.title`)}
                </h3>
                <p className="mt-1.5 text-[13.5px]! leading-relaxed! text-hero-fg-soft sm:text-[14.5px]!">
                  {t(`howItWorks.steps.${step.key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
