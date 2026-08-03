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

const CONTROL = `
block w-full rounded-2xl
border border-hero-border
bg-white/3
backdrop-blur-sm
px-5
text-[15px]
text-hero-fg
outline-none
transition-all
duration-300
placeholder:text-hero-fg-muted/60
hover:border-primary/40
focus:border-primary
focus:bg-white/5
focus:shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.12)]
`;

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
    <div className="relative overflow-hidden rounded-[32px]  p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
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
          className="
            group
            relative
            mt-2
            inline-flex
            h-14
            w-full
            items-center
            justify-center
            overflow-hidden
          rounded-2xl
            bg-primary
            px-8
            text-[15px]
            font-semibold
            text-white
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-[0_18px_40px_rgba(0,0,0,.22)]
            active:translate-y-0
            disabled:pointer-events-none
            disabled:opacity-60
          "
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />

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