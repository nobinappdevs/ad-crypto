/**
 * The banner glow that page headers sit on.
 *
 * Paints NO base colour — it composites over the page background. Filling one drew
 * a hard band where the header met the section below, which is also why the glow is
 * masked out toward the bottom rather than faded into a specific dark colour.
 *
 * Driven by the `--hero-*` properties, so it follows the theme by itself. Render
 * inside a `relative` parent; content beside it needs `relative z-10`.
 */
const FADE_OUT = "linear-gradient(180deg, #000 0%, #000 52%, rgb(0 0 0 / 0.35) 78%, transparent 100%)";

export function BannerBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ maskImage: FADE_OUT, WebkitMaskImage: FADE_OUT }}
    >
      {/* Brand core, anchored above the section so only its lower bloom washes
          into view — the same read as the top of the hero. */}
      <div
        className="absolute -top-75 left-1/2 h-190 w-205 -translate-x-1/2 blur-[3px] sm:-top-95 sm:h-225 sm:w-270 lg:-top-115 lg:h-270 lg:w-365"
        style={{ background: "var(--hero-glow)", opacity: 0.5 }}
      />
      <div
        className="absolute -top-47.5 left-1/2 h-135 w-160 -translate-x-1/2 blur-[30px] sm:-top-60 sm:h-165 sm:w-195 lg:-top-75 lg:h-200 lg:w-240"
        style={{ background: "var(--hero-halo)", opacity: 0.6 }}
      />

      {/* Corner accents live in a centred 1440px frame — the design canvas — so
          they don't drift to the edges on ultrawide screens. */}
      <div className="absolute inset-x-0 top-0 mx-auto hidden h-full max-w-360 lg:block">
        <div
          className="absolute -top-10 left-15 h-95 w-105 rounded-full blur-2xl"
          style={{ background: "var(--hero-spot)", opacity: 0.55 }}
        />
        <div
          className="absolute top-10 right-5 h-100 w-100 rounded-full blur-[46px]"
          style={{ background: "var(--hero-spot-2)", opacity: 0.5 }}
        />
      </div>
    </div>
  );
}
