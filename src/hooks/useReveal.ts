"use client";

import { useEffect, type RefObject } from "react";

/**
 * Flips every `[data-reveal]` descendant of `rootRef` to `data-reveal="in"` on first
 * entry into the viewport. The transition lives in globals.css, keyed off that
 * attribute, with an optional `--reveal-delay` for staggering.
 *
 * Elements are unobserved once revealed — a one-way entrance, not a replay.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((node) => (node.dataset.reveal = "in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [rootRef]);
}
