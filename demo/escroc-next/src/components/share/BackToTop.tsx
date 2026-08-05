"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const SIZE = 44;          // button diameter (px)
const STROKE = 3;         // ring stroke width (px)
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const EASE = 0.18;        // lerp factor — higher = snappier, lower = floatier

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BackToTop() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  const arcRef = useRef(null);     // the progress <circle>, driven directly
  const target = useRef(0);        // scroll progress we're easing toward
  const current = useRef(0);       // currently displayed progress
  const rafId = useRef(null);
  const running = useRef(false);

  useEffect(() => {
    const reduce = prefersReducedMotion();

    function draw() {
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - current.current)}`;
      }
    }

    // Continuous easing loop — interpolates current -> target every frame for
    // buttery motion, then parks itself once it has caught up.
    function tick() {
      const diff = target.current - current.current;
      current.current += reduce ? diff : diff * EASE;
      if (Math.abs(target.current - current.current) < 0.0004) {
        current.current = target.current;
        draw();
        running.current = false;
        return;
      }
      draw();
      rafId.current = requestAnimationFrame(tick);
    }

    function start() {
      if (running.current) return;
      running.current = true;
      rafId.current = requestAnimationFrame(tick);
    }

    function onScroll() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      target.current = total > 0 ? Math.min(scrolled / total, 1) : 0;
      setVisible(scrolled > 300);
      start();
    }

    onScroll();
    current.current = target.current; // no intro sweep on first paint
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t("common.backToTop")}
      className={`fixed bottom-6 right-6 cursor-pointer z-50 flex items-center justify-center rounded-full bg-card shadow-lg shadow-primary/10 transition-[opacity,transform] duration-300  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        visible ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
      }`}
      style={{ width: SIZE, height: SIZE }}
    >
      {/* SVG ring + arrow */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        aria-hidden
        className="absolute inset-0"
      >
        {/* track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          className="stroke-border"
        />
        {/* progress arc — starts at 12-o'clock via rotate(-90deg) */}
        <circle
          ref={arcRef}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          className="stroke-primary"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
      </svg>

      <ArrowUp size={14} strokeWidth={2.4} className="relative text-heading" aria-hidden />
    </button>
  );
}
