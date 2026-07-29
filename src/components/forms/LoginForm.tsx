"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useLogin } from "@/hooks/useAuth";
import { loginRequestSchema, type LoginRequest } from "@/schemas/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const { t } = useLang();
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
        if (fieldErrors) {
          (["email", "password"] as const).forEach((field) => {
            const msg = fieldErrors[field]?.[0];
            if (msg) setError(field, { type: "server", message: msg });
          });
        }
      },
    });
  };

  return (
    <div>
      <h3>{t("auth.loginTitle")}</h3>
      <p className="mt-1">{t("auth.loginSubtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
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
            <Input
              type="password"
              label={t("auth.labelPassword")}
              placeholder={t("auth.passwordPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              leftIcon={<Lock size={16} strokeWidth={2} aria-hidden />}
            />
          )}
        />

        <div className="flex justify-end">
          <Link href="#" className="text-[13px]! text-primary">
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={login.isPending}
          disabled={login.isPending}
        >
          {login.isPending ? t("auth.loggingIn") : t("auth.loginButton")}
        </Button>
      </form>

      <p className="mt-6 text-center">
        {t("auth.noAccount")}{" "}
        <Link href="#" className="inline! text-primary">
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}
