"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSubmit } from "@/components/auth/AuthSubmit";
import { PasswordField } from "@/components/auth/PasswordField";
import { Recaptcha } from "@/components/share/Recaptcha";
import { useLogin } from "@/hooks/useAuth";
import { useRecaptcha } from "@/hooks/useBasicSettings";
import { loginRequestSchema, type LoginRequest } from "@/schemas/auth.schema";

/** Shape of a Laravel 422 validation error body. */
type LaravelErrors = { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } };

export function LoginForm() {
  const { t } = useLang();
  const login = useLogin();
  const { enabled: recaptchaEnabled, siteKey } = useRecaptcha();

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

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
    // Block submission until the reCAPTCHA is solved (only when it's enabled).
    if (recaptchaEnabled && !captchaToken) {
      setCaptchaError(t("auth.recaptchaError"));
      return;
    }
    setCaptchaError("");

    login.mutate(
      { ...data, recaptchaToken: captchaToken },
      {
        onError: (err) => {
          // The reCAPTCHA token is single-use — reset it so the user can retry.
          setCaptchaToken("");
          setCaptchaReset((n) => n + 1);
          const fieldErrors = (err as LaravelErrors).response?.data?.errors;
          if (fieldErrors) {
            (["email", "password"] as const).forEach((field) => {
              const msg = fieldErrors[field]?.[0];
              if (msg) setError(field, { type: "server", message: msg });
            });
          }
        },
      },
    );
  };

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      cardLabel={t("auth.login")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t("auth.register")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              type="email"
              label={t("auth.labelEmail")}
              placeholder={t("auth.emailPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
              leftIcon={<Mail size={16} strokeWidth={2} aria-hidden />}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordField
              label={t("auth.labelPassword")}
              placeholder={t("auth.passwordPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <Input type="checkbox" label={t("auth.rememberMe")} />
          <Link href="/forgot-password" className="shrink-0 text-sm font-medium text-primary hover:underline">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        {recaptchaEnabled && (
          <div className="pt-1">
            <Recaptcha
              siteKey={siteKey}
              resetSignal={captchaReset}
              onVerify={(token) => {
                setCaptchaToken(token);
                if (token) setCaptchaError("");
              }}
            />
            {captchaError && <p className="mt-1.5 text-sm text-rose-500">{captchaError}</p>}
          </div>
        )}

        <AuthSubmit loading={login.isPending} loadingLabel={t("auth.loggingIn")}>
          {t("auth.loginButton")}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
