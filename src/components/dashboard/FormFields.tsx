"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ImageUp, Paperclip, TriangleAlert, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

/**
 * The pieces the dashboard's long forms are built from — the KYC and card
 * application screens. They share the trade fields' surface (`bg-surface`, a 13px
 * label, the same focus ring) so a form field and an amount field read as parts of
 * one system, but they carry what a validated form needs and a trade row does not:
 * a required marker, and an error slot under the control.
 */

const CONTROL =
  "h-13 w-full rounded-xl border bg-surface px-3 text-[14px] text-heading outline-none transition placeholder:text-muted";
const CONTROL_OK = "border-border focus:border-primary focus:ring-2 focus:ring-primary/20";
const CONTROL_BAD = "border-hero-neg focus:ring-2 focus:ring-hero-neg/25";

export function FormLabel({
  children,
  required,
  hint,
  htmlFor,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className="text-[13px] font-semibold text-heading">
        {children}
        {required && (
          <span aria-hidden className="inline! text-hero-neg">
            {" *"}
          </span>
        )}
      </span>
      {hint && <span className="text-[11.5px]! font-normal! text-muted">{hint}</span>}
    </label>
  );
}

/** The error line under a control. Nothing renders when there is no error. */
function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px]! text-hero-neg">
      <TriangleAlert size={12} aria-hidden className="shrink-0" />
      {children}
    </p>
  );
}

/** A titled block of fields. Numbered, so a long form reads as a sequence. */
export function FormSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid! h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-[12.5px]! font-bold! text-primary"
        >
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px]! leading-tight! font-bold!">{title}</h3>
          {description && <p className="mt-1 text-[12.5px]! text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
  hint,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  hint?: string;
  type?: "text" | "email" | "tel" | "date";
  inputMode?: "text" | "email" | "numeric" | "tel";
  autoComplete?: string;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("min-w-0", className)}>
      <FormLabel htmlFor={id} required={required} hint={hint}>
        {label}
      </FormLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={cn(
          CONTROL,
          error ? CONTROL_BAD : CONTROL_OK,
          // Without this the native date picker paints a light control — and its
          // calendar glyph disappears — on the dark theme.
          type === "date" && "[color-scheme:light] dark:[color-scheme:dark]",
        )}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
  hint,
  rows = 4,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("min-w-0", className)}>
      <FormLabel htmlFor={id} required={required} hint={hint}>
        {label}
      </FormLabel>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          "block w-full resize-y rounded-xl border bg-surface px-3 py-2.5 text-[14px] leading-relaxed text-heading outline-none transition placeholder:text-muted",
          error ? CONTROL_BAD : CONTROL_OK,
        )}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

/**
 * Image upload with a thumbnail of what was picked.
 *
 * The preview is the point: these are photographs of documents, and "IMG_4821.jpg"
 * tells the user nothing about whether they attached the front of their ID or a
 * picture of their lunch. Drag-and-drop is supported alongside the file dialog.
 *
 * The object URL is created here and revoked when the file changes or the field
 * unmounts — a preview left behind is a leaked blob for the life of the tab.
 */
export function FileField({
  label,
  file,
  onChange,
  error,
  required,
  hint,
  placeholder,
  browseLabel,
  removeLabel,
  className,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
  required?: boolean;
  hint?: string;
  placeholder: string;
  browseLabel: string;
  removeLabel: string;
  className?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  /**
   * Derived from the file rather than mirrored into state by an effect: a preview
   * IS the file, so an effect that sets state to match it only adds a render pass
   * where the thumbnail is a frame behind the name beside it.
   *
   * The effect below owns just the cleanup, which is the part that genuinely has to
   * happen outside render — a URL left unrevoked is a blob held for the tab's life.
   */
  const preview = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(next: File | null) {
    onChange(next);
    // The input keeps its own value, so re-picking the same file after a removal
    // would fire no change event without this.
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("min-w-0", className)}>
      <FormLabel required={required} hint={hint}>
        {label}
      </FormLabel>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) pick(dropped);
        }}
        className={cn(
          "flex items-center gap-3 rounded-xl border border-dashed bg-surface p-2.5 transition",
          error
            ? "border-hero-neg"
            : dragging
              ? "border-primary bg-primary/6"
              : "border-border hover:border-primary/60",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {/* The label IS the click target, so the whole row opens the dialog — but it
            stops short of the remove button, which must not re-open it. */}
        <label
          htmlFor={id}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 focus-within:outline-none"
        >
          {preview ? (
            // A blob URL of a user-picked file: next/image would need it declared
            // as a remote pattern, and there is nothing to optimise.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-border"
            />
          ) : (
            <span
              aria-hidden
              className="grid! h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
            >
              <ImageUp size={18} />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-[13px] font-semibold",
                file ? "text-heading" : "font-medium text-muted",
              )}
            >
              {file?.name ?? placeholder}
            </span>
            <span className="block text-[11.5px] text-muted">
              {file ? `${(file.size / 1024).toFixed(0)} KB` : browseLabel}
            </span>
          </span>
        </label>

        {file ? (
          <button
            type="button"
            onClick={() => pick(null)}
            aria-label={removeLabel}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-hero-neg/10 hover:text-hero-neg"
          >
            <X size={15} />
          </button>
        ) : (
          <span
            aria-hidden
            className="grid! h-8 w-8 shrink-0 place-items-center rounded-lg bg-black/5 text-muted dark:bg-white/8"
          >
            <Paperclip size={14} />
          </span>
        )}
      </div>

      <FieldError>{error}</FieldError>
    </div>
  );
}
