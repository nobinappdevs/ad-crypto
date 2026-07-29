"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "h-9 text-[13px]",
  md: "h-11 text-[14px]",
  lg: "h-12 text-[16px]",
};

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  inputSize = "md",
  className,
  id,
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descriptionId = hint || error ? `${inputId}-description` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "mb-1.5 block text-[13px] font-medium",
            error ? "text-rose-600" : "text-heading",
          )}
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-surface px-3 transition focus-within:ring-2",
          error
            ? "border-rose-500 focus-within:ring-rose-500/30"
            : "border-border focus-within:ring-primary/30",
          SIZES[inputSize],
        )}
      >
        {leftIcon && <span className="inline-flex shrink-0 text-muted">{leftIcon}</span>}
        <input
          id={inputId}
          className={cn(
            "block w-full min-w-0 flex-1 bg-transparent text-heading placeholder:text-muted outline-none",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          {...props}
        />
        {rightIcon && <span className="inline-flex shrink-0 text-muted">{rightIcon}</span>}
      </div>
      {(hint || error) && (
        <p
          id={descriptionId}
          className={cn("mt-1.5 text-[12px]!", error ? "text-rose-600" : "text-muted")}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
