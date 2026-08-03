import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

/**
 * Shared "dash + label" section kicker: a short primary-colour rule next to an
 * uppercase, letter-spaced label, sitting above a section's main heading.
 *
 * Sections don't share one text-colour token (--suite-muted, --panel-muted,
 * plain currentColor, ...), so colour is passed through as either a Tailwind
 * class (`textClassName`) or a raw CSS value (`color`, for tokens with no
 * Tailwind mapping) rather than baked in here.
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
