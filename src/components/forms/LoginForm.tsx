"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLang } from "@/hooks/useLang";
import { useLogin } from "@/hooks/useAuth";
import { loginRequestSchema, type LoginRequest } from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AUTH_SUBMIT_CLASS, AuthInput, AuthPasswordInput } from "@/components/auth/AuthField";

/**
 * The right-hand column on `/login` — `AuthShell` supplies the rest, so swapping to
 * `/register` swaps only this column.
 */
export function LoginForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.${name}`);
  const login = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  // "The credentials does not match" is one message about the pair, not about
  // either field, so it belongs in the toast rather than under an input.
  return (
    <form
      onSubmit={handleSubmit((data) => login.mutate(data))}
      noValidate
      className="flex flex-col gap-5.5"
      style={{ animation: "panel-rise 0.45s ease both" }}
    >
      <AuthBackHome />

      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("loginTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
          {k("loginBlurb")}
        </p>
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <AuthInput
            type="email"
            placeholder={k("loginEmail")}
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
            placeholder={k("loginPassword")}
            error={errors.password?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-[13.5px]! font-semibold! text-primary">
          {k("forgot")}
        </Link>
      </div>

      <button
        type="submit"
        disabled={login.isPending}
        className={AUTH_SUBMIT_CLASS}
      >
        {login.isPending ? t("auth.loggingIn") : k("loginCta")}
      </button>

      {/* A single text flow, not a flex row of separate items — that way a
          narrow column or a longer translation wraps like an ordinary
          sentence instead of snapping the link onto its own line. */}
      <p className="text-center text-[13.5px]! text-panel-muted">
        {k("loginPrompt")}{" "}
        <Link href="/register" className="inline! font-bold! text-primary">
          {k("loginAction")}
        </Link>
      </p>
    </form>
  );
}
