"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLang } from "@/hooks/useLang";
import { useLogin } from "@/hooks/useAuth";
import { loginRequestSchema, type LoginRequest } from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AuthInput, AuthPasswordInput } from "@/components/auth/AuthField";

/**
 * The right-hand column on `/login`. `AuthShell` (in the route group's layout)
 * supplies everything else — the promo panel, the theme toggle, the panel frame
 * — so this only ever renders the form itself, and swapping to `/register` swaps
 * only this column.
 */
export function LoginForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.${name}`);
  const login = useLogin();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data, {
      onError: (err) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldErrors = (err as any)?.response?.data?.errors;
        if (!fieldErrors) return;
        (["email", "password"] as const).forEach((field) => {
          const msg = fieldErrors[field]?.[0];
          if (msg) setError(field, { type: "server", message: msg });
        });
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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
        className="mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252/0.44)] disabled:cursor-default disabled:hover:translate-y-0"
        style={{ boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" }}
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
