"use client";

import { useEffect, useState } from "react";

/** Ignore jitter below this many px so a trackpad wobble doesn't toggle the bar. */
const THRESHOLD = 6;

/** Always keep the bar visible within this distance of the top of the page. */
const TOP_ZONE = 80;

/**
 * Hide-on-scroll-down, show-on-scroll-up header state.
 *
 * `hidden` — the bar should be translated out of view.
 * `scrolled` — the page has left the top zone, so the bar wants a backdrop.
 */
export function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;

    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - last;

      setScrolled(y > TOP_ZONE);

      if (y <= TOP_ZONE) {
        // Near the top the bar is always shown, regardless of direction.
        setHidden(false);
      } else if (Math.abs(delta) > THRESHOLD) {
        setHidden(delta > 0); // down -> hide, up -> reveal
      }

      // Only advance the reference point once we've acted on the delta,
      // otherwise slow scrolling never accumulates past the threshold.
      if (Math.abs(delta) > THRESHOLD) last = y;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { hidden, scrolled };
}
