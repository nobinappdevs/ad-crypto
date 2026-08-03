import type { ReactNode } from "react";

/**
 * The page shell — ONE max width and ONE horizontal padding scale for the whole
 * site. The nav bar, the hero's framed layers and every section measure from
 * this, so on a wide (or zoomed-out) window the content stops growing and
 * simply centres instead of walking out to the window's edges.
 *
 * The number that matters is the CONTENT measure: 1180px, which is what
 * `Overview`, `WelcomeApp`'s canvas and the footer are already drawn on. 1292 is
 * that plus the 56px gutter this shell carries from `lg` up (1180 + 2 x 56), so
 * those three land on exactly the same edge as everything else at every width
 * without having to be redrawn.
 *
 * `SHELL_MAX` is the same frame WITHOUT the padding — for decorative layers whose
 * offsets are measured from the frame's edge rather than from the text column.
 */
export const SHELL_MAX = "mx-auto w-full max-w-[1292px]";
export const SHELL = `${SHELL_MAX} px-4 sm:px-6 lg:px-14`;

export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`${SHELL} ${className}`}>{children}</div>;
}
