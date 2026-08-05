"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSubmit } from "@/components/auth/AuthSubmit";
import { useForgotSendOtp } from "@/hooks/useAuth";
import { forgotRequestSchema, type ForgotRequest } from "@/schemas/auth.schema";

type LaravelErrors = { response?: { data?: { errors?: Record<string, string[]> } } };

export function ForgotPasswordForm() {
  const { t } = useLang();
  const forgot = useForgotSendOtp();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotRequest>({
    resolver: zodResolver(forgotRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotRequest) => {
    forgot.mutate(data.email, {
      onError: (err) => {
        const fe = (err as LaravelErrors).response?.data?.errors;
        const msg = fe?.credentials?.[0] ?? fe?.email?.[0];
        if (msg) setError("email", { message: msg });
      },
    });
  };

  return (
    <AuthShell
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSubtitle")}
      cardLabel={t("auth.sendResetCode")}
      footer={
        <Link href="/login" className="font-semibold text-primary hover:underline">
          ← {t("auth.login")}
        </Link>
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
        <AuthSubmit loading={forgot.isPending} loadingLabel={t("auth.sending")}>
          {t("auth.sendResetCode")}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
