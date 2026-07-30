"use client";

import { useEffect, type RefObject } from "react";

/** The viewport width at which the sticky scroll scene turns on (Tailwind `lg`). */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** How much of the gap to the target we close per frame. Lower = smoother/laggier. */
const SMOOTHING = 0.085;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Normalize `p` inside the [a, b] window, clamped to 0..1 outside it. */
export const segment = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Smoothstep — soft acceleration in and out. */
export const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * Drives a scroll-linked scene with a requestAnimationFrame loop.
 *
 * `apply` receives progress 0..1 through `sceneRef`'s scroll runway, eased
 * toward the real scroll position so the motion glides instead of snapping.
 * Runs only on desktop widths; below that it calls `apply(0)` once so the
 * component can render its static stacked layout with no inline transforms.
 */
export function useScrollProgress(
  sceneRef: RefObject<HTMLElement | null>,
  apply: (progress: number, isDesktop: boolean) => void,
) {
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let current = 0;

    const readTarget = () => {
      // The sticky stage is one viewport tall, so that — not a fixed 900px — is
      // what the runway has to subtract, or progress finishes early or late
      // depending on the window height.
      const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
      return clamp01(-scene.getBoundingClientRect().top / travel);
    };

    const loop = () => {
      const target = readTarget();
      // Reduced motion: track scroll 1:1 so nothing keeps moving after the
      // user stops. Otherwise ease toward the target for a smooth glide.
      if (reduced.matches) {
        if (current !== target) {
          current = target;
          apply(current, true);
        }
      } else {
        const delta = target - current;
        if (Math.abs(delta) > 0.00015) {
          current += delta * SMOOTHING;
          apply(current, true);
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf) return;
      current = readTarget();
      apply(current, true);
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      current = 0;
      apply(0, false); // clears inline transforms -> CSS owns the mobile layout
    };

    const sync = () => (desktop.matches ? start() : stop());

    sync();
    desktop.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sceneRef, apply]);
}
