"use client";

import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { User, Mail } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSubmit } from "@/components/auth/AuthSubmit";
import { PasswordField } from "@/components/auth/PasswordField";
import { Recaptcha } from "@/components/share/Recaptcha";
import { useRegister } from "@/hooks/useAuth";
import { useRecaptcha, useRegistrationEnabled } from "@/hooks/useBasicSettings";
import { registerRequestSchema, type RegisterRequest } from "@/schemas/auth.schema";

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "auth.strengthWeak", "auth.strengthFair", "auth.strengthGood", "auth.strengthStrong"];
const STRENGTH_COLORS = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"];

type LaravelErrors = { response?: { data?: { errors?: Record<string, string[]> } } };

export function RegisterForm() {
  const { t } = useLang();
  const register = useRegister();
  const { enabled: recaptchaEnabled, siteKey } = useRecaptcha();
  const { enabled: registrationEnabled } = useRegistrationEnabled();

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { type: "buyer", name: "", email: "", password: "", password_confirmation: "", policy: false },
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const strength = getStrength(password);

  const onSubmit = (data: RegisterRequest) => {
    // Block submission until the reCAPTCHA is solved (only when it's enabled).
    if (recaptchaEnabled && !captchaToken) {
      setCaptchaError(t("auth.recaptchaError"));
      return;
    }
    setCaptchaError("");

    const [first_name, ...rest] = data.name.trim().split(/\s+/);
    register.mutate(
      {
        type: data.type,
        first_name,
        last_name: rest.join(" ") || first_name,
        email: data.email,
        password: data.password,
        recaptchaToken: captchaToken,
      },
      {
        onError: (err) => {
          // The reCAPTCHA token is single-use — reset it so the user can retry.
          setCaptchaToken("");
          setCaptchaReset((n) => n + 1);
          const fe = (err as LaravelErrors).response?.data?.errors;
          if (fe) {
            if (fe.email?.[0]) setError("email", { message: fe.email[0] });
            if (fe.password?.[0]) setError("password", { message: fe.password[0] });
            if (fe.first_name?.[0]) setError("name", { message: fe.first_name[0] });
          }
        },
      },
    );
  };

  // Gate the whole submit — not just `onSubmit` — so the "signups are closed"
  // toast fires even when the fields haven't passed validation yet.
  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!registrationEnabled) {
      e.preventDefault();
      toast.error(t("auth.registrationDisabled"));
      return;
    }
    handleSubmit(onSubmit)(e);
  };

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      cardLabel={t("auth.register")}
      footer={
        <>
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("auth.login")}
          </Link>
        </>
      }
    >
      <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
        {/* Role toggle */}
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div>
              <p className="mb-2 text-sm font-medium text-heading">{t("auth.labelRole")}</p>
              {/* `border-border`, not a white tint — on the light theme the page
                  background is white too, so a white border is invisible and the
                  segmented control stops reading as a control at all. */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-white/60 p-1 backdrop-blur-sm dark:bg-white/5">
                {(["buyer", "seller"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => field.onChange(opt)}
                    className={`cursor-pointer rounded-lg py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                      field.value === opt
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "border border-border/70 bg-card/50 text-muted hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {t(`auth.role.${opt}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              type="text"
              label={t("auth.labelFullName")}
              placeholder={t("auth.fullNamePlaceholder")}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.name?.message}
              leftIcon={<User size={16} strokeWidth={2} aria-hidden />}
            />
          )}
        />

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

        <div>
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
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      n <= strength ? STRENGTH_COLORS[strength] : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">{t(STRENGTH_LABELS[strength])}</span>
            </div>
          )}
        </div>

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

        <div className="pt-1">
          <Controller
            name="policy"
            control={control}
            render={({ field }) => (
              <Input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                error={errors.policy?.message}
                label={
                  <span className="leading-snug">
                    {t("auth.agreeTerms")}{" "}
                    <Link href="#" className="font-medium text-primary hover:underline">{t("auth.terms")}</Link>
                    {" "}{t("auth.and")}{" "}
                    <Link href="#" className="font-medium text-primary hover:underline">{t("auth.privacyPolicy")}</Link>
                  </span>
                }
              />
            )}
          />
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

        <AuthSubmit loading={register.isPending} loadingLabel={t("auth.creatingAccount")}>
          {t("auth.registerButton")}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
