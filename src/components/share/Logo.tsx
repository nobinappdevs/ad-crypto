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
