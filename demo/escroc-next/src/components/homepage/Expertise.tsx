"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

const RADIUS = 37;        // % of the orbit box, center → each node
const AUTOPLAY_MS = 3500; // time each item stays active

export function Expertise() {
  const { t } = useLang();
  const items = t("expertise.items");
  const list = Array.isArray(items) ? items : [];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = list[active];

  // Auto-advance through the orbit; pauses while hovered.
  useEffect(() => {
    if (paused || list.length <= 1) return;
    const id = setInterval(() => {
      setActive((p) => (p + 1) % list.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, list.length]);

  return (
    <section id="features" className="relative overflow-hidden bg-bg py-24 lg:py-32">
      {/* ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-96 w-176 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]" />

      {/* ── Side decorations (fill the empty margins) ── */}
      {/* Left: concentric rings */}
      <div aria-hidden className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 xl:block">
        <div className="relative h-56 w-56 opacity-70">
          <div className="absolute inset-0 rounded-full border border-primary/12" />
          <div className="absolute inset-8 rounded-full border border-primary/10" />
          <div className="absolute inset-16 rounded-full border border-primary/8" />
          <div className="absolute inset-20 rounded-full bg-primary/5 blur-sm" />
        </div>
      </div>
      {/* Right: dot grid */}
      <div aria-hidden className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 xl:block">
        <div className="grid grid-cols-6 gap-2.5">
          {Array.from({ length: 36 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-primary" style={{ opacity: 0.05 + (i % 6) * 0.03 }} />
          ))}
        </div>
      </div>

      {/* Floating glass badges */}
      <div aria-hidden className="pointer-events-none absolute left-10 top-1/3 hidden animate-[floaty_7s_ease-in-out_infinite] items-center gap-2.5 rounded-2xl border border-border bg-card/80 px-4 py-2.5 shadow-card backdrop-blur-sm 2xl:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name="shield" size={16} />
        </span>
        <span className="text-xs font-bold text-heading">{t("expertise.badgeExperts")}</span>
      </div>
      <div aria-hidden className="pointer-events-none absolute bottom-1/4 right-10 hidden animate-[floaty_6s_ease-in-out_infinite] items-center gap-2.5 rounded-2xl border border-border bg-card/80 px-4 py-2.5 shadow-card backdrop-blur-sm 2xl:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <Icon name="check" size={16} />
        </span>
        <span className="text-xs font-bold text-heading">{t("expertise.badgeGuidance")}</span>
      </div>

      <Container>
        <SectionHeader tag={t("expertise.tag")} title={t("expertise.title")} align="center" />

        <div className="mx-auto mt-16 grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-8">

          {/* ── Orbit selector ── */}
          <div
            className="relative mx-auto aspect-square w-full max-w-md"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Outer rotating dashed ring */}
            <div aria-hidden className="absolute inset-0 animate-[spinSlow_40s_linear_infinite] rounded-full border border-dashed border-primary/25" />

            {/* Autoplay progress ring (around the hub) */}
            <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-[16%] -rotate-90">
              <circle cx="50" cy="50" r="48" fill="none" strokeWidth="1.5" className="stroke-primary/15" />
              <circle
                key={active}
                cx="50"
                cy="50"
                r="48"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                className="stroke-primary"
                style={{
                  animation: `ring-progress ${AUTOPLAY_MS}ms linear`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            </svg>

            {/* Center hub */}
            <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/70 text-white shadow-2xl shadow-primary/30 sm:h-40 sm:w-40">
              <div key={active} className="flex flex-col items-center animate-[fade-up_400ms_ease-out]">
                <Icon name={current?.icon} size={34} />
                <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white/70">
                  {String(active + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Satellite nodes */}
            {list.map((item, i) => {
              const angle = (i / list.length) * 2 * Math.PI; // 0 = top
              // Round to fixed precision so SSR and client markup match exactly
              // (raw floats hydrate-mismatch on tiny rounding differences).
              const x = (50 + RADIUS * Math.sin(angle)).toFixed(3);
              const y = (50 - RADIUS * Math.cos(angle)).toFixed(3);
              const isActive = active === i;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  aria-pressed={isActive}
                  aria-label={item.title}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-2xl border transition-all duration-300 sm:h-16 sm:w-16 ${
                    isActive
                      ? "scale-110 border-primary bg-primary text-white shadow-lg shadow-primary/30"
                      : "border-border bg-card text-muted hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  <Icon name={item.icon} size={24} />
                  {isActive && (
                    <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-primary/30" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Detail (borderless, animated) ── */}
          {current && (
            <div key={active} className="text-center animate-[fade-up_450ms_ease-out] lg:text-left">
              <span className="font-mono text-sm font-bold tracking-widest text-primary/60">
                {String(active + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2">{current.title}</h3>
              <p className="mt-4 leading-relaxed text-muted lg:max-w-md">{current.desc}</p>

              <a
                href="#contact"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                {t("expertise.learnMore")}
                <Icon name="arrow" size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          )}

        </div>
      </Container>
    </section>
  );
}
