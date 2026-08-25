import type { ReactNode } from "react";

/**
 * The page shell — ONE max width and ONE padding scale for the whole site, so wide
 * windows centre the content instead of stretching it.
 *
 * The number that matters is the 1180px CONTENT measure that `Overview`,
 * `WelcomeApp` and the footer are drawn on; 1292 is that plus this shell's 56px
 * gutters. `SHELL_MAX` is the same frame WITHOUT the padding, for decorative
 * layers measured from the frame's edge.
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
