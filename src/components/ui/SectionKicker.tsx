import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/**
 * Shared "dash + label" section kicker, above a section's main heading.
 *
 * Sections do not share one muted-text token, so colour comes in as a Tailwind
 * class (`textClassName`) or a raw CSS value (`color`) rather than being baked in.
 */
export function SectionKicker({
  children,
  className,
  textClassName,
  color,
}: {
  children: ReactNode;
  className?: string;
  textClassName?: string;
  color?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden className="h-0.5 w-[26px] shrink-0 bg-primary" />
      <span
        className={cn("text-[12px]! font-medium! tracking-[0.2em] uppercase", textClassName)}
        style={color ? ({ color } as CSSProperties) : undefined}
      >
        {children}
      </span>
    </div>
  );
}
