import Image from "next/image";
import { cn } from "@/components/ui/cn";

/** The wordmark asset. `_dark` = dark LETTERING, i.e. the light-mode logo. */
const INTRINSIC = { width: 1350, height: 361 };

/** The glyph window as fractions of the asset width — measured off the PNGs. */
const GLYPH = { left: 0.028, right: 0.252 };
const GLYPH_WIDTH_RATIO = GLYPH.right - GLYPH.left;
const ASPECT = INTRINSIC.width / INTRINSIC.height;

export function Logo({ className }: { className?: string }) {
  // `alt` stays on each <Image>: jsx-a11y reads the JSX, not a spread object.
  const shared = { ...INTRINSIC, priority: true };
  // Sized by max-width with `h-auto`, so the ratio drives the height. Height
  // utilities do not work here: `h-full` resolves to `auto` in an auto-height parent.
  const base = cn("h-auto max-w-30 lg:max-w-32 xl:max-w-40", className);

  return (
    <span className="inline-flex! items-center">
      <Image
        {...shared}
        alt="AdCrypto"
        src="/assets/logo/web_logo_dark.png"
        className={cn(base, "dark:hidden")}
      />
      {/* Same alt on both — `display: none` keeps the hidden one out of the a11y tree. */}
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
 * The hexagon alone, for the dashboard rail. There is no icon-only asset, so it
 * crops the wordmark: a glyph-sized box over a wider image pulled left.
 * `max-w-none` is required or Next clamps the image back to the box.
 */
export function LogoMark({ height = 26, className }: { height?: number; className?: string }) {
  // `alt` per <Image>, as in `Logo`.
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
