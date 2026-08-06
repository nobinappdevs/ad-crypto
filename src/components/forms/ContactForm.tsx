"use client";

import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import {
  contactRequestSchema,
  type ContactRequest,
} from "@/schemas/contact.schema";
import { cn } from "@/components/ui/cn";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold uppercase tracking-[0.08em] text-hero-fg/80"
      >
        {label}
      </label>

      {children}

      {error && (
        <p className="pl-1 text-xs font-medium text-rose-400">{error}</p>
      )}
    </div>
  );
}

/**
 * The shared field surface.
 *
 * One flat string, NOT a multi-line template literal: a class list with newlines in
 * it ends up in the DOM's `class` attribute verbatim, and the same list written as a
 * multi-line JSX string literal gets its whitespace collapsed — which is what made
 * the submit button below hydrate with a mismatch. Keeping every class list on one
 * line means the server and the client can only ever produce the same string.
 *
 * `--primary__color` is the project's token; the earlier `--primary-rgb` here did
 * not exist, so the focus ring silently rendered nothing.
 */
const CONTROL =
  "block w-full rounded-2xl border border-hero-border bg-white/3 px-5 text-[15px] text-hero-fg outline-none backdrop-blur-sm transition-all duration-300 placeholder:text-hero-fg-muted/60 hover:border-primary/40 focus:border-primary focus:bg-white/5 focus:shadow-[0_0_0_4px_rgb(var(--primary__color)/0.12)]";

export function ContactForm() {
  const { t } = useLang();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactRequest>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));

    toast.success(t("contact.sentSuccess"));
    reset();
  };

  return (
    <div className="relative overflow-hidden rounded-[32px]  p-6 dark:shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
      {/* glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative space-y-6"
        noValidate
      >
        {/* Name */}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Field
              label={t("contact.labelName")}
              htmlFor="contact-name"
              error={errors.name?.message}
            >
              <input
                {...field}
                id="contact-name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className={cn(
                  CONTROL,
                  "h-14",
                  errors.name && "border-rose-400"
                )}
              />
            </Field>
          )}
        />

        {/* Email */}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Field
              label={t("contact.labelEmail")}
              htmlFor="contact-email"
              error={errors.email?.message}
            >
              <input
                {...field}
                id="contact-email"
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                className={cn(
                  CONTROL,
                  "h-14",
                  errors.email && "border-rose-400"
                )}
              />
            </Field>
          )}
        />

        {/* Message */}
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <Field
              label={t("contact.labelMessage")}
              htmlFor="contact-message"
              error={errors.message?.message}
            >
              <textarea
                {...field}
                id="contact-message"
                rows={6}
                placeholder="Tell us about your project, idea or question..."
                className={cn(
                  CONTROL,
                  "min-h-[180px] resize-none py-4 leading-7",
                  errors.message && "border-rose-400"
                )}
              />
            </Field>
          )}
        />

        {/* Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          // `btn-lift` brings the sheen with it as a pseudo-element, which replaced
          // the hand-rolled sweeping <span> this button used to render.
          className="btn-lift mt-2 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-primary px-8 text-[15px] font-semibold text-white disabled:pointer-events-none disabled:opacity-60"
        >
          <span className="relative flex items-center gap-2">
            {isSubmitting ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity=".25"
                    strokeWidth="4"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>

                {t("contact.sending")}
              </>
            ) : (
              <>
                {t("contact.sendButton")}

                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14m-6-6 6 6-6 6"
                  />
                </svg>
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
}