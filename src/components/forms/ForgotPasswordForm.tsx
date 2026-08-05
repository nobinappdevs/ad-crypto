"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLang } from "@/hooks/useLang";
import { useForgotPassword, useResetPassword, useVerifyOtp } from "@/hooks/useAuth";
import {
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
  verifyOtpRequestSchema,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type VerifyOtpRequest,
} from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AuthInput, AuthPasswordInput } from "@/components/auth/AuthField";
import { AuthOtpBoxes } from "@/components/auth/AuthOtpBoxes";
import toast from "react-hot-toast";

/** Seconds the resend link stays disabled after a code goes out. */
const RESEND_COOLDOWN = 30;

type Step = "email" | "otp" | "reset";

const STEP_LABEL_KEY: Record<Step, string> = {
  email: "stepOne",
  otp: "stepTwo",
  reset: "stepThree",
};

/**
 * The full "forgot password" flow, as one linear wizard on a single route rather
 * than three routes: email -> OTP -> new password. Unlike login/register (two
 * peer destinations you can jump between) these steps only ever run in order, so
 * there's nothing a separate URL per step would buy the user — only more places
 * for a refresh to strand them mid-flow.
 *
 * Each step is its own `useForm`, since the fields don't overlap; the email and
 * OTP the later steps need are carried forward in plain state instead. The
 * `key={step}` on the shared wrapper remounts it on every advance, which is what
 * replays the `panel-rise` entrance each step gets on `/login` and `/register`.
 */
export function ForgotPasswordForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const forgotPassword = useForgotPassword();
  const verifyOtp = useVerifyOtp();
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
          onSent={(sentEmail) => {
            setEmail(sentEmail);
            setCooldown(RESEND_COOLDOWN);
            setStep("otp");
          }}
          mutate={forgotPassword}
        />
      )}

      {step === "otp" && (
        <OtpStep
          email={email}
          cooldown={cooldown}
          onResend={() => {
            forgotPassword.mutate(
              { email },
              {
                onSuccess: () => {
                  toast.success(k("resendSuccessToast"));
                  setCooldown(RESEND_COOLDOWN);
                },
              },
            );
          }}
          onVerified={(code) => {
            setOtp(code);
            setStep("reset");
          }}
          onChangeEmail={() => setStep("email")}
          mutate={verifyOtp}
        />
      )}

      {step === "reset" && <ResetStep email={email} otp={otp} mutate={resetPassword} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — email                                                              */
/* -------------------------------------------------------------------------- */

function EmailStep({
  onSent,
  mutate,
}: {
  onSent: (email: string) => void;
  mutate: ReturnType<typeof useForgotPassword>;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: ForgotPasswordRequest) => {
    mutate.mutate(data, {
      onSuccess: () => {
        toast.success(k("otpSentToast"));
        onSent(data.email);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("emailTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
          {k("emailBlurb")}
        </p>
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <AuthInput
            type="email"
            placeholder={t("authPanel.loginEmail")}
            error={errors.email?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            autoFocus
          />
        )}
      />

      <button
        type="submit"
        disabled={mutate.isPending}
        className="mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252/0.44)] disabled:cursor-default disabled:hover:translate-y-0"
        style={{ boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" }}
      >
        {mutate.isPending ? k("sending") : k("sendOtp")}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — OTP                                                                */
/* -------------------------------------------------------------------------- */

function OtpStep({
  email,
  cooldown,
  onResend,
  onVerified,
  onChangeEmail,
  mutate,
}: {
  email: string;
  cooldown: number;
  onResend: () => void;
  onVerified: (otp: string) => void;
  onChangeEmail: () => void;
  mutate: ReturnType<typeof useVerifyOtp>;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpRequest>({
    resolver: zodResolver(verifyOtpRequestSchema),
    defaultValues: { email, otp: "" },
  });

  const onSubmit = (data: VerifyOtpRequest) => {
    mutate.mutate(data, {
      onSuccess: () => {
        toast.success(k("otpVerifiedToast"));
        onVerified(data.otp);
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
          {k("otpBlurbLead")} <span className="inline! font-semibold! text-panel-fg">{email}</span>
          . {k("otpBlurbTail")}{" "}
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
        name="otp"
        control={control}
        render={({ field }) => (
          <AuthOtpBoxes
            value={field.value}
            onChange={field.onChange}
            error={errors.otp?.message}
            disabled={mutate.isPending}
            autoFocus
          />
        )}
      />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onResend}
          disabled={cooldown > 0}
          className="text-[13.5px]! font-semibold! text-primary disabled:cursor-default disabled:text-panel-muted"
        >
          {cooldown > 0 ? `${k("resendIn")} 0:${cooldown.toString().padStart(2, "0")}` : k("resend")}
        </button>
      </div>

      <button
        type="submit"
        disabled={mutate.isPending}
        className="mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252/0.44)] disabled:cursor-default disabled:hover:translate-y-0"
        style={{ boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" }}
      >
        {mutate.isPending ? k("verifying") : k("verify")}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 3 — new password                                                       */
/* -------------------------------------------------------------------------- */

function ResetStep({
  email,
  otp,
  mutate,
}: {
  email: string;
  otp: string;
  mutate: ReturnType<typeof useResetPassword>;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.forgotPassword.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email, otp, password: "", confirmPassword: "" },
  });

  const onSubmit = (data: ResetPasswordRequest) => {
    mutate.mutate({ email: data.email, otp: data.otp, password: data.password });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("resetTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
          {k("resetBlurb")}
        </p>
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
        name="confirmPassword"
        control={control}
        render={({ field }) => (
          <AuthPasswordInput
            placeholder={k("confirmPassword")}
            error={errors.confirmPassword?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <button
        type="submit"
        disabled={mutate.isPending}
        className="mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252/0.44)] disabled:cursor-default disabled:hover:translate-y-0"
        style={{ boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" }}
      >
        {mutate.isPending ? k("resetting") : k("resetCta")}
      </button>
    </form>
  );
}
