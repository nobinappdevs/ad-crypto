"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

/**
 * The solid variants carry `btn-lift` (see globals.css): they read as raised
 * surfaces, so they get the lift, the glow and the sheen.
 *
 * The flat ones deliberately do not. `ghost` and `outline` have no fill to catch a
 * sheen and no elevation to lift from — giving them a drop shadow on hover would
 * invent a surface that is not there. They change their fill instead, which is the
 * whole point of the variant.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "btn-lift bg-primary text-white",
  secondary: "bg-surface text-heading hover:bg-surface/80",
  outline: "border border-border text-heading hover:border-primary/60 hover:bg-surface",
  ghost: "text-heading hover:bg-black/4 dark:hover:bg-white/6",
  // `--hero-neg` is a bare triple, so the same glow machinery runs in red.
  danger: "btn-lift bg-hero-neg text-white [--btn-glow:var(--hero-neg)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-6 text-[16px]",
};

export function Button({
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
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
