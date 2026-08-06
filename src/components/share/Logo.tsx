import Image from "next/image";
import { cn } from "@/components/ui/cn";

/**
 * The AdCrypto wordmark.
 *
 * Two files, swapped by CSS rather than by reading the theme in JS: `dark:hidden`
 * / `hidden dark:block` are driven by the `[data-theme]` attribute the boot script
 * sets before paint, so the correct logo is right on the very first frame. Picking
 * with `useTheme()` would render the light logo during SSR and flip after
 * hydration, which shows as a flash on every load.
 *
 * `_dark` names the ASSET, not the theme it belongs to: it has dark lettering, so
 * it is the LIGHT-mode logo. The plain file letters are white, for dark mode.
 */
const INTRINSIC = { width: 1350, height: 361 };

/**
 * Where the hexagon mark starts and ends, as fractions of the asset's width —
 * measured off the PNGs, which place the glyph identically in both. `LogoMark`
 * crops to exactly this window so the icon-only rail can show the brand without a
 * 12px-tall wordmark beside it. If the logo files are ever re-exported, re-measure.
 *
 * BOTH edges matter: cropping from zero leaves the asset's own left margin inside
 * the box, which pushes the glyph off centre — the visible symptom being a mark
 * that looks nudged right in a rail that is otherwise perfectly centred.
 */
const GLYPH = { left: 0.028, right: 0.252 };
const GLYPH_WIDTH_RATIO = GLYPH.right - GLYPH.left;
const ASPECT = INTRINSIC.width / INTRINSIC.height;

export function Logo({ className }: { className?: string }) {
  // `alt` is written on each <Image> rather than spread in with the rest: the
  // jsx-a11y rule reads the JSX, not the object, so a spread `alt` looks to it
  // like no alt at all.
  const shared = { ...INTRINSIC, priority: true };
  // Sized by max-width — 120px small, 128px at `lg`, 160px from `xl` up — with
  // `h-auto` so the 3.74:1 ratio drives the height. The `lg` step is smaller than
  // `xl` on purpose: between 1024 and 1280 the nav bar is carrying five links, a
  // language pill, a theme toggle and a CTA on the same row, and a 160px wordmark
  // in the middle of that is what tipped it into overflow.
  //
  // Height utilities are deliberately NOT used: `h-full` resolves to `auto`
  // against an auto-height parent, and the intrinsic 1350px width is what a
  // max-width clamps cleanly.
  const base = cn("h-auto max-w-30 lg:max-w-32 xl:max-w-40", className);

  return (
    <span className="inline-flex! items-center">
      <Image
        {...shared}
        alt="AdCrypto"
        src="/assets/logo/web_logo_dark.png"
        className={cn(base, "dark:hidden")}
      />
      {/* Both carry the same alt, not one real and one empty: `display: none` takes
          the inactive one out of the accessibility tree entirely, so whichever theme
          is on, exactly one "AdCrypto" is announced. */}
      <Image
        {...shared}
        alt="AdCrypto"
        src="/assets/logo/web_logo.png"
        className={cn(base, "hidden dark:block")}
      />
    </span>
  );
}

/**
 * The hexagon on its own, for places too narrow for the wordmark — currently the
 * dashboard rail.
 *
 * There is no icon-only asset, so this crops the full logo: a box the size of the
 * glyph, `overflow-hidden`, over an image laid out much wider than the box and
 * pulled left by the asset's own margin so the glyph lands dead centre.
 *
 * `max-w-none` is required — without it Next's image styles clamp the width back to
 * the box and the whole wordmark squeezes into 25px.
 *
 * `height` is the glyph's rendered height in px; the box width follows from the
 * measured ratio, so callers size it in one number and it can never be stretched.
 */
export function LogoMark({ height = 26, className }: { height?: number; className?: string }) {
  // `alt` written per <Image>, for the same reason as in `Logo` above.
  const shared = { ...INTRINSIC, priority: true };
  const imageWidth = height * ASPECT;
  const size = { height, width: imageWidth, marginLeft: -imageWidth * GLYPH.left };

  return (
    <span
      className={cn("block shrink-0 overflow-hidden", className)}
      style={{ height, width: imageWidth * GLYPH_WIDTH_RATIO }}
    >
      <Image
        {...shared}
        alt="AdCrypto"
        src="/assets/logo/web_logo_dark.png"
        style={size}
        className={cn("max-w-none", "dark:hidden")}
      />
      <Image
        {...shared}
        alt="AdCrypto"
        src="/assets/logo/web_logo.png"
        style={size}
        className={cn("max-w-none", "hidden dark:block")}
      />
    </span>
  );
}
