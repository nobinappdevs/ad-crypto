"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useRegister } from "@/hooks/useAuth";
import { useRegistrationOpen } from "@/hooks/useBasicSettings";
import { registerRequestSchema, type RegisterRequest } from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AUTH_SUBMIT_CLASS, AuthInput, AuthPasswordInput } from "@/components/auth/AuthField";

/**
 * The right-hand column on `/register`. `AuthShell` (in the route group's layout)
 * supplies everything else, so this only ever renders the form itself.
 *
 * On success `useRegister` decides where to go: `/verify-email` when the account
 * owes an email code, straight to the dashboard when the backend has email
 * verification switched off. Either way the token it returns is already stored,
 * which is what lets the verify screen authenticate.
 */
export function RegisterForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.${name}`);
  const register = useRegister();
  /**
   * The admin's switch, read from `/basic-settings` rather than assumed. Closed
   * means the form is not rendered at all — a disabled button beside filled-in
   * fields reads as a bug, and posting anyway would only trade a clear message for
   * whatever the API happens to say.
   */
  const { open: registrationOpen } = useRegistrationOpen();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      policy: false,
    },
  });

  if (!registrationOpen) {
    return (
      <div
        className="flex flex-col gap-5.5"
        style={{ animation: "panel-rise 0.45s ease both" }}
      >
        <AuthBackHome />

        <div className="flex flex-col gap-2.5">
          <span
            aria-hidden
            className="grid! h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"
          >
            <Lock size={20} />
          </span>
          <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]!">
            {k("registerClosed")}
          </h1>
          <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
            {k("registerClosedNote")}
          </p>
        </div>

        <Link href="/login" className={`${AUTH_SUBMIT_CLASS} text-center`}>
          {k("tabLogin")}
        </Link>
      </div>
    );
  }

  // Server-side complaints stay in the toast: this API returns them as a flat
  // list of sentences (`message.error`), not a bag keyed by field, so there is
  // nothing to attach to an individual input. Zod covers the per-field checks.
  return (
    <form
      onSubmit={handleSubmit((data) => register.mutate(data))}
      noValidate
      className="flex flex-col gap-5.5"
      style={{ animation: "panel-rise 0.45s ease both" }}
    >
      <AuthBackHome />

      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("registerTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
          {k("registerBlurb")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Controller
          name="first_name"
          control={control}
          render={({ field }) => (
            <AuthInput
              type="text"
              placeholder={k("firstName")}
              error={errors.first_name?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="last_name"
          control={control}
          render={({ field }) => (
            <AuthInput
              type="text"
              placeholder={k("lastName")}
              error={errors.last_name?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <AuthInput
            type="email"
            placeholder={k("registerEmail")}
            error={errors.email?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <AuthPasswordInput
            placeholder={k("registerPassword")}
            error={errors.password?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      {/* onClick lives on the label, not the checkbox glyph — the glyph is the
          only thing that used to toggle it, so clicking "I have agreed with"
          did nothing. The Terms link stops the click from bubbling up to the
          label, so following it doesn't also flip the checkbox underneath it. */}
      <Controller
        name="policy"
        control={control}
        render={({ field }) => (
          <div>
            <label
              onClick={() => field.onChange(!field.value)}
              className="flex cursor-pointer items-center gap-2.75 text-[13.5px]! text-panel-muted"
            >
              <span
                aria-hidden
                className="grid! h-5 w-5 shrink-0 place-items-center rounded-md border transition-[background,border-color] duration-250"
                style={{
                  borderColor: field.value
                    ? "rgb(var(--primary__color))"
                    : errors.policy
                      ? "#d4483f"
                      : "var(--panel-border)",
                  background: field.value ? "rgb(var(--primary__color))" : "transparent",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: field.value ? 1 : 0 }}
                  aria-hidden
                >
                  <path d="M4.5 12.5l5 5 10-11" />
                </svg>
              </span>
              <span className="text-[13.5px]! text-panel-muted">
                {k("termsLead")}{" "}
                <Link
                  href="#"
                  onClick={(e) => e.stopPropagation()}
                  className="inline! text-[13.5px]! text-primary"
                >
                  {k("termsLink")}
                </Link>
              </span>
            </label>
            {errors.policy && (
              <span className="mt-1.5 block text-[12.5px]! text-[#d4483f]">
                {errors.policy.message}
              </span>
            )}
          </div>
        )}
      />

      <button type="submit" disabled={register.isPending} className={AUTH_SUBMIT_CLASS}>
        {register.isPending ? k("registering") : k("registerCta")}
      </button>

      <p className="text-center text-[13.5px]! text-panel-muted">
        {k("registerPrompt")}{" "}
        <Link href="/login" className="inline! font-bold! text-primary">
          {k("registerAction")}
        </Link>
      </p>
    </form>
  );
}
