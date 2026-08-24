"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLang } from "@/hooks/useLang";
import { SectionKicker } from "@/components/ui/SectionKicker";

/* -------------------------------------------------------------------------- */
/* Motion constants — taken verbatim from the source design                    */
/* -------------------------------------------------------------------------- */

/** How long one card's swap takes, as a fraction of the scene's progress. */
const SPAN = 0.52;
/** Offset between consecutive cards, so the swap reads as a sequence not a cut. */
const STEP_DELAY = 0.16;
/** Share of the gap to the target closed per frame. Lower = smoother/laggier. */
const SMOOTHING = 0.045;

/**
 * The slice of the 620vh runway the swap is mapped onto. The lead-in lets the
 * panel settle after it pins; the lead-out holds batch B on screen for a beat
 * before the section scrolls away.
 */
const WINDOW_START = 0.08;
const WINDOW_END = 0.78;

const DESKTOP_QUERY = "(min-width: 1024px)";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Cubic in-out. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Left-column cards travel left, right-column cards travel right: batch A slides
 * out sideways and batch B glides back in from the same sides, so the two passes
 * read as one gesture rather than a crossfade.
 */
const dirOf = (i: number) => (i % 2 === 0 ? -1 : 1);

const transformA = (i: number, outT: number) =>
  `translate3d(${(dirOf(i) * 130 * outT).toFixed(2)}px, ${(-10 * outT).toFixed(2)}px, 0)` +
  ` scale(${(1 - 0.06 * outT).toFixed(4)}) rotate(${(dirOf(i) * 1.6 * outT).toFixed(3)}deg)`;

const transformB = (i: number, inT: number) =>
  `translate3d(${(dirOf(i) * 150 * (1 - inT)).toFixed(2)}px, ${(14 * (1 - inT)).toFixed(2)}px, 0)` +
  ` scale(${(0.94 + 0.06 * inT).toFixed(4)}) rotate(${(dirOf(i) * -1.8 * (1 - inT)).toFixed(3)}deg)`;

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

/** Card glyphs, keyed to the copy. Drawn on a 24-unit grid at 1.7 stroke. */
const CARD_GLYPHS: Record<string, ReactNode> = {
  smsEmail: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
      <path d="M3.4 7.4l8.6 5.6 8.6-5.6" />
      <path d="M15.4 16.6l1.7 1.7 3.1-3.4" />
    </>
  ),
  kyc: (
    <>
      <rect x="3" y="3.6" width="18" height="16.8" rx="2.4" />
      <circle cx="9.4" cy="10" r="2.3" />
      <path d="M5.8 16.6c0.9-1.9 6-1.9 7 0" />
      <path d="M15.4 9.4h3.2M15.4 12.8h3.2" />
    </>
  ),
  twoFa: (
    <>
      <rect x="3.4" y="2.8" width="10" height="18.4" rx="2.2" />
      <path d="M6.6 18.4h3.6" />
      <circle cx="17.6" cy="9.4" r="3.2" />
      <path d="M17.6 12.6v5.8l1.8 1.4" />
    </>
  ),
  encryption: (
    <>
      <path d="M4 8.6l8-4.4 8 4.4v6.8l-8 4.4-8-4.4z" />
      <path d="M8.4 12h7.2" />
      <circle cx="8.4" cy="12" r="1.4" />
      <circle cx="15.6" cy="12" r="1.4" />
    </>
  ),
  behavior: (
    <>
      <path d="M3 17.2l4.4-5.6 3 3.4 3.4-6 4.2 8.2" />
      <path d="M2.6 20.4h18.8" />
      <circle cx="18" cy="5.6" r="1.8" />
    </>
  ),
  ssl: (
    <>
      <rect x="3.6" y="10" width="16.8" height="10.4" rx="2.4" />
      <path d="M7.6 10V7.4a4.4 4.4 0 018.8 0V10" />
      <path d="M12 14v2.6" />
    </>
  ),
  waf: (
    <>
      <path d="M3.4 4.6h17.2v14.8H3.4z" />
      <path d="M3.4 9.6h17.2M3.4 14.6h17.2M9 4.6v5M15 9.6v5M9 14.6v4.8" />
    </>
  ),
  rbac: (
    <>
      <circle cx="9.4" cy="8.4" r="3.2" />
      <path d="M3.8 19c0.8-3.2 3-4.8 5.6-4.8 1.1 0 2.1 0.3 3 0.8" />
      <path d="M17.4 12.4l3.2 1.2v3c0 2.1-1.3 3.5-3.2 4.2-1.9-0.7-3.2-2.1-3.2-4.2v-3z" />
    </>
  ),
};

function CardGlyph({ name, color }: { name: string; color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      // `stroke` has to arrive as a CSS property, not a presentation attribute:
      // browsers do not resolve var() inside attributes.
      className="transition-[stroke] delay-140 duration-380"
      style={{ stroke: color }}
      aria-hidden
    >
      {CARD_GLYPHS[name]}
    </svg>
  );
}

function PillGlyph({ group, color }: { group: "a" | "b"; color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ stroke: color }}
      aria-hidden
    >
      {group === "a" ? (
        <>
          <path d="M12 3.2l7 2.6v5.9c0 4.3-2.9 7.2-7 8.9-4.1-1.7-7-4.6-7-8.9V5.8l7-2.6z" />
          <path d="M9.2 12.1l2 2 3.6-3.9" />
        </>
      ) : (
        <>
          <path d="M4.5 8.5h15M4.5 15.5h15" />
          <circle cx="9" cy="8.5" r="2" />
          <circle cx="15" cy="15.5" r="2" />
        </>
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Content — the first entry of each batch is the highlighted tile              */
/* -------------------------------------------------------------------------- */

/** Pass one. */
const BATCH_A = ["smsEmail", "kyc", "twoFa", "encryption"] as const;
/** Pass two, revealed as the scene scrolls. */
const BATCH_B = ["behavior", "ssl", "waf", "rbac"] as const;

/* -------------------------------------------------------------------------- */
/* The travelling highlight                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Which card holds the dark skin. It starts on the first tile and is handed to
 * whichever card the pointer enters — the previous holder keeps rendering its own
 * copy for one beat so the two can animate as a single hand-off. `seq` exists
 * only to force the overlay to remount, which is what replays the animation.
 */
type Skin = { cur: number; prev: number; seq: number };

const SKIN_START: Skin = { cur: 0, prev: -1, seq: 0 };

/**
 * How far the skin appears to travel. Not the real distance between cells: the
 * overlay is inside the card, so it can only slide within it — enough to carry
 * the direction of the hand-off, and no further. A larger offset leaves the far
 * edge of the card uncovered mid-flight, which shows as white copy on the light
 * resting surface; this is why the copy's own colour change is delayed too.
 */
const SKIN_TRAVEL_X = 34;
const SKIN_TRAVEL_Y = 26;

/** Cell coordinates in the 2x2 grid. Below `sm` the grid is one column, where the
 *  horizontal term reads as a slight drift — harmless, and still directional. */
const colOf = (i: number) => i % 2;
const rowOf = (i: number) => Math.floor(i / 2);

/** Offset that points from card `from` toward card `to`. */
const skinTravel = (from: number, to: number) => ({
  dx: (colOf(from) - colOf(to)) * SKIN_TRAVEL_X,
  dy: (rowOf(from) - rowOf(to)) * SKIN_TRAVEL_Y,
});

/* -------------------------------------------------------------------------- */
/* Pill skins — theme-independent in the source design, so they are literals    */
/* -------------------------------------------------------------------------- */

const PILL_ON = {
  bg: "rgb(var(--primary__color))",
  fg: "#ffffff",
  br: "rgb(var(--primary__color))",
  chip: "var(--suite-pill-on-chip)",
  icon: "#ffffff",
  shadow: "var(--suite-pill-on-shadow)",
};

const PILL_OFF = {
  bg: "var(--suite-pill-off-bg)",
  fg: "var(--suite-pill-off-fg)",
  br: "var(--suite-pill-off-br)",
  chip: "var(--suite-pill-off-chip)",
  icon: "var(--suite-pill-off-icon)",
  shadow: "none",
};

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The chip's gradient is now the SAME in both states, with only its base colour,
 * border and shadow switching — those are colours, and colours interpolate. The
 * two-gradient version could not be transitioned at all (`background-image` does
 * not tween), so the tile used to hard-cut while everything around it glided.
 */
const CHIP_GRADIENT =
  "linear-gradient(158deg, rgb(255 255 255 / 0.28) 0%, rgb(255 255 255 / 0.06) 53%, rgb(255 255 255 / 0.02) 100%)";

function SuiteCard({
  name,
  active,
  leaving,
  animate,
  token,
  dx,
  dy,
  onEnter,
  cardRef,
  initialOpacity,
  initialTransform,
}: {
  name: string;
  active: boolean;
  /** Held the skin until a moment ago — still on screen, animating out. */
  leaving: boolean;
  /** False on first paint, when there is no previous card to travel from. */
  animate: boolean;
  /** Changes on every hand-off, so the overlay remounts and replays. */
  token: string;
  dx: number;
  dy: number;
  onEnter: () => void;
  cardRef: (el: HTMLElement | null) => void;
  initialOpacity: number;
  initialTransform: string;
}) {
  const { t } = useLang();
  const base = `suite.items.${name}`;

  return (
    <article
      ref={cardRef}
      data-suite-card={active ? "active" : "idle"}
      // `isolate` is what lets the skin sit at -z-10: it keeps the overlay inside
      // the card's own stacking context, above the card's background but below
      // the copy — so the text never needs a z-index of its own.
      className="relative isolate flex min-h-0 flex-col justify-center gap-[7px] overflow-hidden rounded-2xl border px-4 py-[15px] transition-[border-color,background-color,box-shadow] duration-380 will-change-[transform,opacity]"
      // Colours come from the `[data-suite-card]` rules in globals.css so the
      // hovers there can win; only the scroll-driven properties stay inline.
      style={{ opacity: initialOpacity, transform: initialTransform }}
      onPointerEnter={onEnter}
    >
      {(active || leaving) && (
        <span
          key={token}
          aria-hidden
          data-leaving={leaving ? "" : undefined}
          data-static={animate ? undefined : ""}
          className="suite-skin pointer-events-none absolute inset-0 -z-10"
          style={{ "--sx": `${dx}px`, "--sy": `${dy}px` } as CSSProperties}
        />
      )}

      <span
        aria-hidden
        className="grid! h-[34px] w-[34px] shrink-0 place-items-center rounded-[11px] border transition-[background-color,border-color,box-shadow] delay-140 duration-380"
        style={{
          backgroundImage: CHIP_GRADIENT,
          backgroundColor: active ? "var(--suite-active-chip)" : "var(--suite-chip-bg)",
          borderColor: active ? "rgb(255 255 255 / 0.22)" : "rgb(255 255 255 / 0.16)",
          boxShadow: active
            ? "inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -3px 6px rgb(0 0 0 / 0.28), 0 6px 14px rgb(1 20 40 / 0.35)"
            : "inset 0 1px 0 rgb(255 255 255 / 0.32), inset 0 -3px 6px rgb(0 0 0 / 0.2), 0 6px 14px rgb(1 20 40 / 0.28)",
        }}
      >
        <CardGlyph
          name={name}
          color={active ? "var(--suite-active-icon)" : "var(--suite-chip-icon)"}
        />
      </span>

      <h4
        className="text-[15px]! leading-[1.25]! font-bold! tracking-[-0.01em] transition-[color] delay-140 duration-380"
        style={{ color: active ? "var(--suite-active-fg)" : "var(--suite-card-fg)" }}
      >
        {t(`${base}.title`)}
      </h4>
      <p
        className="text-[12.5px]! leading-[1.5]! transition-[color] delay-140 duration-380"
        style={{ color: active ? "var(--suite-active-muted)" : "var(--suite-card-muted)" }}
      >
        {t(`${base}.text`)}
      </p>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

export function SecuritySuite() {
  const { t } = useLang();

  const sceneRef = useRef<HTMLDivElement>(null);
  const cardsA = useRef<(HTMLElement | null)[]>([]);
  const cardsB = useRef<(HTMLElement | null)[]>([]);
  const gridA = useRef<HTMLDivElement>(null);
  const gridB = useRef<HTMLDivElement>(null);
  const fillA = useRef<HTMLSpanElement>(null);
  const fillB = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  /**
   * Below `lg` there is no runway to scroll through, so the same 0..1 progress is
   * driven by which group pill was tapped instead — one interpolation, two input
   * devices, identical motion out the other end.
   */
  const tabRef = useRef(0);

  // Which pass is current. It flips once, at the midpoint, so labels and pill
  // colours re-render twice per scene rather than sixty times a second —
  // everything else is written straight to the DOM.
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);

  // One highlight per pass, so hovering through batch A does not disturb where
  // batch B's skin will land when it arrives.
  const [skinA, setSkinA] = useState<Skin>(SKIN_START);
  const [skinB, setSkinB] = useState<Skin>(SKIN_START);

  const applyProgress = useCallback((raw: number) => {
    const t0 = ease(clamp01(raw));

    const nextStep = t0 > 0.5 ? 1 : 0;
    if (nextStep !== stepRef.current) {
      stepRef.current = nextStep;
      setStep(nextStep);
    }

    for (let i = 0; i < 4; i++) {
      const ct = clamp01((t0 - i * STEP_DELAY) / SPAN);
      const outT = clamp01(ct / 0.46);
      const inT = clamp01((ct - 0.54) / 0.46);

      const a = cardsA.current[i];
      if (a) {
        a.style.opacity = (1 - clamp01(outT * 1.25)).toFixed(3);
        a.style.transform = transformA(i, outT);
      }
      const b = cardsB.current[i];
      if (b) {
        b.style.opacity = clamp01((inT - 0.12) / 0.88).toFixed(3);
        b.style.transform = transformB(i, inT);
      }
    }

    if (fillA.current) fillA.current.style.width = `${(clamp01(t0 / 0.5) * 100).toFixed(1)}%`;
    if (fillB.current)
      fillB.current.style.width = `${(clamp01((t0 - 0.5) / 0.5) * 100).toFixed(1)}%`;
    if (bar.current) bar.current.style.width = `${(50 + 50 * t0).toFixed(1)}%`;

    if (gridA.current) gridA.current.style.pointerEvents = nextStep === 0 ? "auto" : "none";
    if (gridB.current) gridB.current.style.pointerEvents = nextStep === 1 ? "auto" : "none";
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let current = 0;
    let painted = -1;

    const readTarget = () => {
      if (!desktop.matches) return tabRef.current;
      // The pinned stage is one viewport tall, so that is what the runway has to
      // subtract — a fixed figure would finish early or late by window height.
      const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
      const p = clamp01(-scene.getBoundingClientRect().top / travel);
      return clamp01((p - WINDOW_START) / (WINDOW_END - WINDOW_START));
    };

    const loop = () => {
      const target = readTarget();
      // Reduced motion: track the input 1:1 so nothing keeps moving after the
      // user stops. Otherwise ease toward it for the glide.
      if (reduced.matches) {
        current = target;
      } else {
        current += (target - current) * SMOOTHING;
        if (Math.abs(target - current) < 0.0003) current = target;
      }
      if (Math.abs(current - painted) > 0.0002) {
        painted = current;
        applyProgress(current);
      }
      raf = requestAnimationFrame(loop);
    };

    current = readTarget();
    applyProgress(current);
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [applyProgress]);

  /**
   * Desktop: scroll the runway to the position that maps to the requested pass,
   * so the pills stay honest about where you are. Below `lg`: just move the
   * target and let the same tween run.
   */
  const goTo = (target: 0 | 1) => {
    tabRef.current = target;

    const scene = sceneRef.current;
    if (!scene || !window.matchMedia(DESKTOP_QUERY).matches) return;

    const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
    const top = scene.getBoundingClientRect().top + window.scrollY;
    // 0.80 lands just past WINDOW_END, so pass two is fully settled while the
    // stage is still comfortably pinned — 0.86+ drops you at the very end of the
    // runway, where the section is already about to release.
    window.scrollTo({ top: top + travel * (target === 0 ? 0.03 : 0.8), behavior: "smooth" });
  };

  /**
   * Hand the skin to card `i`. The old holder is remembered rather than dropped:
   * both cards render an overlay on the next frame — one animating in from the
   * other's direction, one animating out toward it.
   */
  const handOver = (skin: Skin, setSkin: (s: Skin) => void) => (i: number) => {
    if (i === skin.cur) return;
    setSkin({ cur: i, prev: skin.cur, seq: skin.seq + 1 });
  };

  /** Both batches render identically; only their data and their skin differ. */
  const batch = (
    names: readonly string[],
    skin: Skin,
    setSkin: (s: Skin) => void,
    cards: typeof cardsA,
    initial: (i: number) => string,
    initialOpacity: number,
  ) => {
    const take = handOver(skin, setSkin);

    return names.map((name, i) => {
      const active = i === skin.cur;
      // In: from the old holder toward this card. Out: the reverse.
      const { dx, dy } = active ? skinTravel(skin.prev, i) : skinTravel(skin.cur, i);

      return (
        <SuiteCard
          key={name}
          name={name}
          active={active}
          leaving={i === skin.prev}
          animate={skin.prev >= 0}
          token={`${skin.seq}`}
          dx={dx}
          dy={dy}
          onEnter={() => take(i)}
          cardRef={(el) => {
            cards.current[i] = el;
          }}
          initialOpacity={initialOpacity}
          initialTransform={initial(i)}
        />
      );
    });
  };

  const stepLabel = step === 0 ? "01 / 02" : "02 / 02";
  const groupName = t(step === 0 ? "suite.groups.a" : "suite.groups.b");

  const pill = (group: "a" | "b") => {
    const on = group === "a" ? step === 0 : step === 1;
    const skin = on ? PILL_ON : PILL_OFF;

    return (
      <button
        type="button"
        onClick={() => goTo(group === "a" ? 0 : 1)}
        aria-pressed={on}
        className="relative flex cursor-pointer items-center gap-[14px] overflow-hidden rounded-full border py-[13px] pr-[22px] pl-[15px] text-left text-[15px]! font-semibold transition-[background,color,border-color,box-shadow,transform] duration-[400ms] hover:translate-x-[3px] sm:text-[15.5px]!"
        style={{
          borderColor: skin.br,
          background: skin.bg,
          color: skin.fg,
          boxShadow: skin.shadow,
        }}
      >
        <span
          aria-hidden
          className="grid! h-[30px] w-[30px] shrink-0 place-items-center rounded-full transition-[background] duration-[400ms]"
          style={{ background: skin.chip }}
        >
          <PillGlyph group={group} color={skin.icon} />
        </span>
        {t(`suite.groups.${group}`)}
        {/* Fills left-to-right across the current pill as the pass plays out. */}
        <span
          aria-hidden
          ref={group === "a" ? fillA : fillB}
          className="absolute bottom-0 left-0 h-0.5 transition-[width] duration-[250ms] ease-linear"
          style={{
            width: "0%",
            background: on ? "var(--suite-pill-underline)" : "transparent",
          }}
        />
      </button>
    );
  };

  return (
    // No `overflow-hidden` here, and none on any ancestor of the sticky stage:
    // an `overflow` other than `visible` makes this element the sticky element's
    // scroll container, and because the section never scrolls internally the
    // panel would simply scroll away with the page instead of pinning. The panel
    // clips its own contents, so nothing needs clipping at this level.
    <section className="relative" style={{ background: "var(--suite-bg)" }}>
      {/* The scroll runway. 320vh leaves ~2.2 viewports of travel, which is what
          the swap plus its lead-in and lead-out need — the source design's 620vh
          was mapped against whole-document progress, so most of it read as dead
          scrolling here. Below `lg` the section is its own height and the pills
          drive the swap instead. */}
      <div ref={sceneRef} className="relative lg:h-[320vh]">
        {/* The `lg` step runs tighter than `xl` throughout this block. At 1024px the
            xl figures (56px section padding, a 300px rail, a 48px gutter, then 44px
            of panel padding) left the card grid about 140px per column, which is
            narrower than the cards' own padding plus a readable measure. */}
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-14 sm:gap-10 sm:px-6 sm:py-16 lg:sticky lg:top-[min(0px,calc(100vh-760px))] lg:min-h-screen lg:flex-row lg:items-center lg:gap-8 lg:px-6 lg:py-10 xl:gap-12 xl:px-14 xl:py-12">
          {/* ---------------- Left column ---------------- */}
          <div className="flex w-full flex-col gap-6 lg:w-[260px] lg:flex-[0_0_260px] lg:gap-[26px] xl:w-[300px] xl:flex-[0_0_300px] xl:gap-[30px]">
            <SectionKicker color="var(--suite-muted)">{t("suite.eyebrow")}</SectionKicker>

            <h2
              className="text-[34px]! leading-[1.02]! font-extrabold! tracking-[-0.03em] text-pretty wrap-break-word sm:text-[44px]! lg:text-[44px]! xl:text-[52px]!"
              style={{ color: "var(--suite-fg)" }} 
            >
              {t("suite.headingLead")} 
              <br />
              <span className="text-primary!">{t("suite.headingAccent")}</span>
            </h2>

            <div className="flex flex-col gap-3">
              {pill("a")}
              {pill("b")}
            </div>

            <div
              className="flex items-center gap-3 tracking-[0.06em]"
              style={{ color: "var(--suite-muted)" }}
            >
              <span className="text-[12.5px]! font-bold!" style={{ color: "var(--suite-fg)" }}>
                {stepLabel}
              </span>
              <span
                aria-hidden
                className="relative h-0.5 flex-1 overflow-hidden rounded-[2px]"
                style={{ background: "var(--suite-card-br)" }}
              >
                <span
                  ref={bar}
                  className="absolute inset-y-0 left-0 rounded-[2px] bg-primary"
                  style={{ width: "50%" }}
                />
              </span>
              <span
                className="hidden text-[12.5px]! font-medium! lg:block!"
                style={{ color: "var(--suite-muted)" }}
              >
                {t("suite.scroll")}
              </span>
            </div>
          </div>

          {/* ---------------- Panel ---------------- */}
          <div
            className="relative w-full min-w-0 overflow-hidden rounded-[26px] lg:h-[660px] lg:flex-1"
            style={{
              background: "var(--suite-panel-bg)",
              boxShadow: "var(--suite-panel-shadow)",
            }}
          >
            {/* Blueprint rules + a corner bloom, so the panel reads as a surface
                rather than a flat swatch. */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <span
                className="absolute inset-y-0 left-[22%] w-px"
                style={{ background: "var(--suite-grid-line)" }}
              />
              <span
                className="absolute inset-y-0 left-[55%] w-px"
                style={{ background: "var(--suite-grid-line)" }}
              />
              <span
                className="absolute inset-x-0 top-[24%] h-px"
                style={{ background: "var(--suite-grid-line)" }}
              />
              <span
                className="absolute inset-x-0 top-[74%] h-px"
                style={{ background: "var(--suite-grid-line)" }}
              />
              <span
                className="absolute -top-[120px] -right-[80px] h-[420px] w-[420px] rounded-full blur-[4px]"
                style={{
                  background:
                    "radial-gradient(closest-side, rgb(1 148 252 / 0.22), transparent 78%)",
                }}
              />
            </div>

            <div className="relative grid grid-cols-1 items-center gap-6 p-5 sm:gap-7 sm:p-7 lg:absolute lg:inset-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:gap-6 lg:px-6 lg:py-8 xl:gap-9 xl:px-11 xl:py-10">
              {/* ---- Intro ---- */}
              <div
                className="flex flex-col gap-[14px] rounded-[18px] border px-5 py-6 xl:px-6.5 xl:py-7"
                style={{
                  borderColor: "var(--suite-intro-br)",
                  background: "var(--suite-intro-bg)",
                }}
              >
                <h3
                  className="text-[22px]! leading-[1.14]! font-bold! tracking-[-0.02em] wrap-break-word sm:text-[25px]! lg:text-[23px]! xl:text-[28px]!"
                  style={{ color: "var(--suite-card-fg)" }}
                >
                  {t("suite.intro.line1")}
                  <br />
                  {t("suite.intro.line2")}
                </h3>
                <p
                  className="text-[13.5px]! leading-[1.6]!"
                  style={{ color: "var(--suite-card-muted)" }}
                >
                  {t("suite.intro.text")}
                </p>
                <div
                  aria-hidden
                  className="my-0.5 h-px"
                  style={{ background: "var(--suite-card-br)" }}
                />
                <div className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-[12.5px]! font-semibold! tracking-[0.02em] text-primary!">
                    {stepLabel} — {groupName}
                  </span>
                </div>
              </div>

              {/* ---- The two passes, stacked in one cell ----
                  On desktop both batches are absolutely positioned inside the
                  panel. Below `lg` they share a single named grid area instead,
                  which keeps them overlapping (only one is ever visible) while
                  letting the container take the height of the taller one — so
                  tapping between passes never resizes the section. */}
              <div
                className="relative grid lg:block lg:h-full"
                style={{ gridTemplateAreas: '"stack"' }}
              >
                <div
                  ref={gridA}
                  aria-hidden={step !== 0}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:absolute lg:inset-0 lg:grid-rows-2"
                  style={{ gridArea: "stack" }}
                >
                  {batch(BATCH_A, skinA, setSkinA, cardsA, (i) => transformA(i, 0), 1)}
                </div>

                <div
                  ref={gridB}
                  aria-hidden={step !== 1}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:absolute lg:inset-0 lg:grid-rows-2"
                  style={{ gridArea: "stack", pointerEvents: "none" }}
                >
                  {batch(BATCH_B, skinB, setSkinB, cardsB, (i) => transformB(i, 0), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
