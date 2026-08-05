"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/components/ui/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretch to the full width of the parent. */
  fullWidth?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
}

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap " +
  "transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-primary text-white shadow-sm hover:bg-primary/90",
  secondary: "bg-heading text-card shadow-sm hover:opacity-90",
  outline:   "border border-border bg-card text-heading hover:border-primary/50 hover:text-primary",
  ghost:     "text-muted hover:bg-black/5 hover:text-heading dark:hover:bg-white/5",
  danger:    "bg-red-500 text-white shadow-sm hover:bg-red-600",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} strokeWidth={2.5} aria-hidden className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
