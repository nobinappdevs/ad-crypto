"use client";

import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { contactRequestSchema, type ContactRequest } from "@/schemas/contact.schema";
import { cn } from "@/components/ui/cn";

/** Label sits above the control, 8px clear of it — as in the reference design. */
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
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] font-medium text-hero-fg/85">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-[12px]! text-rose-400">{error}</p>}
    </div>
  );
}

const CONTROL =
  "block w-full rounded-md border bg-hero-surface px-3.5 text-[14px] text-hero-fg outline-none transition-colors duration-200 placeholder:text-hero-fg-muted/70 focus:border-primary";

export function ContactForm() {
  const { t } = useLang();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactRequest>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success(t("contact.sentSuccess"));
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5" noValidate>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Field label={t("contact.labelName")} htmlFor="contact-name" error={errors.name?.message}>
            <input
              {...field}
              id="contact-name"
              type="text"
              autoComplete="name"
              className={cn(CONTROL, "h-11", errors.name ? "border-rose-400/70" : "border-hero-border border-2  bg-transparent")}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <Field label={t("contact.labelEmail")} htmlFor="contact-email" error={errors.email?.message}>
            <input
              {...field}
              id="contact-email"
              type="email"
              autoComplete="email"
              className={cn(CONTROL, "h-11", errors.email ? "border-rose-400/70" : "border-hero-border border-2  bg-transparent")}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
        )}
      />

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
              rows={5}
              className={cn(
                CONTROL,
                "h-29.5 resize-none py-3 leading-relaxed",
                errors.message ? "border-rose-400/70" : "border-hero-border border-2  bg-transparent",
              )}
              aria-invalid={Boolean(errors.message)}
            />
          </Field>
        )}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex! h-11 w-full items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
      >
        {isSubmitting ? t("contact.sending") : t("contact.sendButton")}
      </button>
    </form>
  );
}
