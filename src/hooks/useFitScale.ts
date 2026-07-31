"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Uniformly scales a fixed-size design canvas down to the width it actually has.
 *
 * Some of the suite's scenes are absolutely-positioned compositions on a fixed
 * canvas — the overlaps between the pieces ARE the design, so reflowing them onto
 * a grid would lose it. Rendering the canvas at its real size and scaling the
 * whole thing keeps every coordinate exact at any width.
 *
 * Spread `attach` onto the *measured wrapper* (the element that gets the real
 * available width) and apply `scale` to the canvas inside it, with a
 * `top left` transform origin and a wrapper height of `designHeight * scale`.
 *
 * Measurement happens in the ref callback, which runs during commit — so the
 * canvas is never painted once at full size before being scaled down. A width of
 * 0 is ignored, which is what keeps a `hidden` canvas from collapsing the scale.
 */
export function useFitScale(designWidth: number) {
  const ref = useRef<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      const width = el.clientWidth;
      if (width > 0) setScale(Math.min(1, width / designWidth));
    },
    [designWidth],
  );

  const attach = useCallback(
    (el: HTMLElement | null) => {
      ref.current = el;
      measure(el);
    },
    [measure],
  );

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(() => measure(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { attach, scale };
}
