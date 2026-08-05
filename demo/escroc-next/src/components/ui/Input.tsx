"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type Size = "sm" | "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Any native input type (`text`, `password`, `email`, `number`, `tel`,
   * `url`, `search`, `date`, …) plus two extras handled specially:
   * `"textarea"` renders a multiline box, `"checkbox"` / `"radio"` render
   * an inline control with the label beside it.
   */
  type?: string;
  /** Text shown above the field (or beside it for checkbox/radio). */
  label?: ReactNode;
  /** Helper text shown below the field (hidden when `error` is set). */
  hint?: ReactNode;
  /** Error message — turns the border/label red and replaces the hint. */
  error?: ReactNode;
  /** Adornment rendered inside, before the text. */
  leftIcon?: ReactNode;
  /** Adornment rendered inside, after the text. */
  rightIcon?: ReactNode;
  inputSize?: Size;
  /** Marks the field as required (adds a red asterisk to the label). */
  required?: boolean;
  /** Rows for the multiline (`type="textarea"`) variant. */
  rows?: number;
}

const SIZES: Record<Size, string> = {
  sm: "h-9 text-xs",
  md: "h-11 text-sm",
  lg: "h-12 text-base",
};

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(function Input(
  {
    type = "text",
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    inputSize = "md",
    required,
    rows = 4,
    id,
    className,
    disabled,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const invalid = Boolean(error);
  const describedBy = hint || error ? `${fieldId}-desc` : undefined;

  const isCheck = type === "checkbox" || type === "radio";
  const isArea = type === "textarea";

  /* shared description line */
  const description = (error || hint) && (
    <p id={`${fieldId}-desc`} className={cn("text-xs", invalid ? "text-red-500" : "text-muted")}>
      {error || hint}
    </p>
  );

  /* ── checkbox / radio: inline control + label ── */
  if (isCheck) {
    return (
      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor={fieldId} className={cn("flex items-start gap-2.5", disabled ? "opacity-50" : "cursor-pointer")}>
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              "mt-0.5 h-4.5 w-4.5 shrink-0 cursor-pointer accent-primary",
              type === "radio" ? "rounded-full" : "rounded",
              className,
            )}
            {...props}
          />
          {label && (
            <span className={cn("text-sm  font-medium", invalid ? "text-red-500" : "text-heading")}>
              {label}
         
            </span>
          )}
        </label>
        {description}
      </div>
    );
  }

  /* ── text-like + textarea: label on top, bordered box ── */
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className={cn("text-sm font-medium", invalid ? "text-red-500" : "text-heading")}>
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex overflow-hidden rounded-xl border bg-surface transition focus-within:ring-2",
          isArea ? "items-stretch" : "items-center",
          invalid
            ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-border focus-within:border-primary focus-within:ring-primary/20",
          disabled && "opacity-50",
        )}
      >
        {leftIcon && (
          <span className={cn("grid shrink-0 place-items-center pl-3 text-muted", isArea && "pt-3")}>
            {leftIcon}
          </span>
        )}

        {isArea ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            rows={rows}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              "min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm font-medium text-heading outline-none placeholder:text-muted",
              className,
            )}
            {...(props as Record<string, unknown>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              "min-w-0 flex-1 bg-transparent px-3 font-medium text-heading outline-none placeholder:text-muted",
              SIZES[inputSize],
              className,
            )}
            {...props}
          />
        )}

        {rightIcon && !isArea && (
          <span className="grid shrink-0 place-items-center pr-3 text-muted">{rightIcon}</span>
        )}
      </div>

      {description}
    </div>
  );
});
