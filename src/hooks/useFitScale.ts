"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Uniformly scales a fixed-size design canvas down to the width it actually has —
 * for scenes whose overlaps ARE the design, which reflowing would lose.
 *
 * Spread `attach` on the measured wrapper and apply `scale` to the canvas inside,
 * with a `top left` origin and a wrapper height of `designHeight * scale`.
 *
 * Measured in the ref callback (during commit), so the canvas is never painted at
 * full size first. A width of 0 is ignored, so a hidden canvas keeps its scale.
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
