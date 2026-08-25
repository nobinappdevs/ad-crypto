"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import {
  useForgotFindUser,
  useForgotResendCode,
  useForgotVerifyCode,
  useResetPassword,
} from "@/hooks/useAuth";
import {
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  verifyCodeRequestSchema,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type VerifyCodeRequest,
} from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AUTH_SUBMIT_CLASS, AuthInput, AuthPasswordInput } from "@/components/auth/AuthField";
import { AuthOtpBoxes } from "@/components/auth/AuthOtpBoxes";

/** Seconds the resend link stays disabled after a code goes out. */
const RESEND_COOLDOWN = 30;

type Step = "email" | "otp" | "reset";

const STEP_LABEL_KEY: Record<Step, string> = {
  email: "stepOne",
  otp: "stepTwo",
  reset: "stepThree",
};

/**
 * The whole forgot-password flow as one wizard on one route: email → code → new
 * password. The steps only ever run in order, so separate URLs would only add
 * places for a refresh to strand someone.
 *
 * Three endpoints threaded on one server-issued token, which lives in
 * `sessionStorage` and is read back by the hooks rather than handled here.
 *
 * Each step is its own `useForm`; `key={step}` remounts the wrapper, which replays
 * the `panel-rise` entrance.
 */
export function ForgotPasswordForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const findUser = useForgotFindUser();
  const resendCode = useForgotResendCode();
  const verifyCode = useForgotVerifyCode();
  const resetPassword = useResetPassword(k("resetSuccessToast"));

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  return (
    <div key={step} style={{ animation: "panel-rise 0.45s ease both" }}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <AuthBackHome href="/login" labelKey="authPanel.forgotPassword.backToLogin" />
        <span className="text-[12px]! font-semibold! tracking-[0.08em] text-panel-muted uppercase">
          {k(STEP_LABEL_KEY[step])}
        </span>
      </div>

      {step === "email" && (
        <EmailStep
          mutate={findUser}
          onSent={(sentEmail) => {
            setEmail(sentEmail);
            setCooldown(RESEND_COOLDOWN);
            setStep("otp");
          }}
        />
      )}

      {step === "otp" && (
        <OtpStep
          email={email}
          cooldown={cooldown}
          mutate={verifyCode}
          resendPending={resendCode.isPending}
          onResend={() => {
            resendCode.mutate(undefined, {
              // Only start the countdown on a send that actually happened — the
              // backend rate-limits this and says how long is left on refusal.
              onSuccess: () => {
                toast.success(k("resendSuccessToast"));
                setCooldown(RESEND_COOLDOWN);
              },
            });
          }}
          onVerified={() => setStep("reset")}
          onChangeEmail={() => setStep("email")}
        />
      )}

      {step === "reset" && <ResetStep mutate={resetPassword} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — which account (POST /password/forgot/find/user)                     */
/* -------------------------------------------------------------------------- */

function EmailStep({
  mutate,
  onSent,
}: {
  mutate: ReturnType<typeof useForgotFindUser>;
  onSent: (email: string) => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { credentials: "" },
  });

  const onSubmit = (data: ForgotPasswordRequest) => {
    mutate.mutate(data, {
      onSuccess: (res) => {
        toast.success(
          (res as { message?: { success?: string[] } })?.message?.success?.[0] ?? k("otpSentToast"),
        );
        onSent(data.credentials);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("emailTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">{k("emailBlurb")}</p>
      </div>

      <Controller
        name="credentials"
        control={control}
        render={({ field }) => (
          <AuthInput
            type="email"
            placeholder={t("authPanel.loginEmail")}
            error={errors.credentials?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            autoFocus
          />
        )}
      />

      <button type="submit" disabled={mutate.isPending} className={AUTH_SUBMIT_CLASS}>
        {mutate.isPending ? k("sending") : k("sendOtp")}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — the code (POST /password/forgot/verify/code)                        */
/* -------------------------------------------------------------------------- */

function OtpStep({
  email,
  cooldown,
  mutate,
  resendPending,
  onResend,
  onVerified,
  onChangeEmail,
}: {
  email: string;
  cooldown: number;
  mutate: ReturnType<typeof useForgotVerifyCode>;
  resendPending: boolean;
  onResend: () => void;
  onVerified: () => void;
  onChangeEmail: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeRequest>({
    resolver: zodResolver(verifyCodeRequestSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = (data: VerifyCodeRequest) => {
    mutate.mutate(data.code, {
      onSuccess: (res) => {
        toast.success(
          (res as { message?: { success?: string[] } })?.message?.success?.[0] ??
            k("otpVerifiedToast"),
        );
        onVerified();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("otpTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
          {k("otpBlurbLead")} <span className="inline! font-semibold! text-panel-fg">{email}</span>.{" "}
          {k("otpBlurbTail")}{" "}
          <button
            type="button"
            onClick={onChangeEmail}
            className="cursor-pointer text-[14px]! font-semibold! text-primary"
          >
            {k("changeEmail")}
          </button>
        </p>
      </div>

      {/* The same boxes the email-verification screen uses — one OTP design across
          both flows, so a code screen always looks like a code screen. */}
      <Controller
        name="code"
        control={control}
        render={({ field }) => (
          <AuthOtpBoxes
            value={field.value}
            onChange={field.onChange}
            error={errors.code?.message}
            disabled={mutate.isPending}
            autoFocus
          />
        )}
      />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0 || resendPending}
          className="text-[13.5px]! font-semibold! text-primary disabled:cursor-default disabled:text-panel-muted"
        >
          {cooldown > 0
            ? `${k("resendIn")} 0:${cooldown.toString().padStart(2, "0")}`
            : resendPending
              ? k("sending")
              : k("resend")}
        </button>
      </div>

      <button type="submit" disabled={mutate.isPending} className={AUTH_SUBMIT_CLASS}>
        {mutate.isPending ? k("verifying") : k("verify")}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — new password (POST /password/forgot/reset)                          */
/* -------------------------------------------------------------------------- */

function ResetStep({ mutate }: { mutate: ReturnType<typeof useResetPassword> }) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutate.mutate(data))}
      noValidate
      className="flex flex-col gap-5.5"
    >
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("resetTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">{k("resetBlurb")}</p>
      </div>

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <AuthPasswordInput
            placeholder={k("newPassword")}
            error={errors.password?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            autoFocus
          />
        )}
      />

      <Controller
        name="password_confirmation"
        control={control}
        render={({ field }) => (
          <AuthPasswordInput
            placeholder={k("confirmPassword")}
            error={errors.password_confirmation?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <button type="submit" disabled={mutate.isPending} className={AUTH_SUBMIT_CLASS}>
        {mutate.isPending ? k("resetting") : k("resetCta")}
      </button>
    </form>
  );
}
