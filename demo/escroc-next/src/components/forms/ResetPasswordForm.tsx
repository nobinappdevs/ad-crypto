"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSubmit } from "@/components/auth/AuthSubmit";
import { PasswordField } from "@/components/auth/PasswordField";
import { useResetPassword } from "@/hooks/useAuth";
import { resetPasswordSchema, type ResetPasswordRequest } from "@/schemas/auth.schema";

export function ResetPasswordForm() {
  const { t } = useLang();
  const reset = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  const onSubmit = (data: ResetPasswordRequest) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("escroc_reset_token") ?? "" : "";
    reset.mutate({
      password: data.password,
      password_confirmation: data.password_confirmation,
      token,
    });
  };

  return (
    <AuthShell
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSubtitle")}
      cardLabel={t("auth.resetButton")}
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          ← {t("auth.login")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        <Controller
          name="password_confirmation"
          control={control}
          render={({ field }) => (
            <PasswordField
              label={t("auth.labelConfirmPassword")}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.password_confirmation?.message}
            />
          )}
        />

        <AuthSubmit loading={reset.isPending} loadingLabel={t("auth.resetting")}>
          {t("auth.resetButton")}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
