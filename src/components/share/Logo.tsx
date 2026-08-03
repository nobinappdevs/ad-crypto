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
 * Where the hexagon mark ends, as a fraction of the asset's width — measured off
 * the PNGs, which place the glyph identically in both. `LogoMark` crops to this
 * so the icon-only rail can show the brand without a 12px-tall wordmark beside
 * it. If the logo files are ever re-exported, re-measure this.
 */
const MARK_WIDTH_RATIO = 0.26;
const MARK_HEIGHT = 34;
const MARK_IMAGE_WIDTH = Math.round(MARK_HEIGHT * (INTRINSIC.width / INTRINSIC.height));
const MARK_BOX_WIDTH = Math.round(MARK_IMAGE_WIDTH * MARK_WIDTH_RATIO);

export function Logo({ className }: { className?: string }) {
  const shared = { ...INTRINSIC, alt: "AdCrypto", priority: true };
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
      <Image {...shared} src="/assets/logo/web_logo_dark.png" className={cn(base, "dark:hidden")} />
      <Image {...shared} src="/assets/logo/web_logo.png" className={cn(base, "hidden dark:block")} />
    </span>
  );
}

/**
 * The hexagon on its own, for places too narrow for the wordmark — currently the
 * collapsed dashboard rail.
 *
 * There is no icon-only asset, so this crops the full logo: a fixed-size box with
 * `overflow-hidden` over an image laid out wider than the box. `max-w-none` is
 * required — without it Next's image styles clamp the width back to the box and
 * the whole wordmark squeezes into 33px.
 */
export function LogoMark({ className }: { className?: string }) {
  const shared = { ...INTRINSIC, alt: "AdCrypto", priority: true };
  const base = "max-w-none";
  const size = { height: MARK_HEIGHT, width: MARK_IMAGE_WIDTH };

  return (
    <span
      className={cn("block shrink-0 overflow-hidden", className)}
      style={{ height: MARK_HEIGHT, width: MARK_BOX_WIDTH }}
    >
      <Image
        {...shared}
        src="/assets/logo/web_logo_dark.png"
        style={size}
        className={cn(base, "dark:hidden")}
      />
      <Image
        {...shared}
        src="/assets/logo/web_logo.png"
        style={size}
        className={cn(base, "hidden dark:block")}
      />
    </span>
  );
}
