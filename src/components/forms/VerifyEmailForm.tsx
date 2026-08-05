"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, RotateCcw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { useResendEmailOtp, useVerifyEmail } from "@/hooks/useAuth";
import {
  forgotPasswordRequestSchema,
  verifyEmailRequestSchema,
  type ForgotPasswordRequest,
  type VerifyEmailRequest,
} from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AuthInput } from "@/components/auth/AuthField";
import { AuthOtpBoxes, OTP_LENGTH } from "@/components/auth/AuthOtpBoxes";
import { clearPendingEmail, getPendingEmail, setPendingEmail } from "@/lib/pendingEmail";

/** Seconds the resend link stays disabled after a code goes out. */
const RESEND_COOLDOWN = 60;

const SUBMIT_CLASS =
  "mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252/0.44)] disabled:cursor-default disabled:hover:translate-y-0";

const SUBMIT_STYLE = { boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" };

/**
 * Email verification for a freshly registered account: confirm the address with
 * a 6-digit code, then go log in.
 *
 * Normally `/register` hands the address over (see `@/lib/pendingEmail`) and this
 * opens straight on the code step. A direct visit has no address to verify, so it
 * asks for one first rather than dead-ending — the same two-step shape the reset
 * flow uses, minus the password step.
 *
 * The countdown is what makes the resend link honest: without it the only way to
 * find out the link is still rate-limited is to press it and be told off.
 */
export function VerifyEmailForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.verifyEmail.${name}`);

  // Read once, at mount: the address never changes underneath us, and reading it
  // in an effect would render one frame of the wrong step.
  const [email, setEmail] = useState(() => getPendingEmail());
  const [step, setStep] = useState<"email" | "otp">(() => (getPendingEmail() ? "otp" : "email"));
  const [cooldown, setCooldown] = useState(() => (getPendingEmail() ? RESEND_COOLDOWN : 0));

  const resend = useResendEmailOtp();
  const verify = useVerifyEmail(k("verifiedToast"));

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
          {k(step === "email" ? "stepOne" : "stepTwo")}
        </span>
      </div>

      {step === "email" ? (
        <EmailStep
          mutate={resend}
          onSent={(sent) => {
            setPendingEmail(sent);
            setEmail(sent);
            setCooldown(RESEND_COOLDOWN);
            setStep("otp");
          }}
        />
      ) : (
        <CodeStep
          email={email}
          cooldown={cooldown}
          verify={verify}
          onResend={() => {
            resend.mutate(
              { email },
              {
                onSuccess: () => {
                  toast.success(k("resendSuccessToast"));
                  setCooldown(RESEND_COOLDOWN);
                },
              },
            );
          }}
          onChangeEmail={() => {
            clearPendingEmail();
            setStep("email");
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 1 — which address (only on a direct visit)                             */
/* -------------------------------------------------------------------------- */

function EmailStep({
  mutate,
  onSent,
}: {
  mutate: ReturnType<typeof useResendEmailOtp>;
  onSent: (email: string) => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.verifyEmail.${name}`);

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
        toast.success(k("codeSentToast"));
        onSent(data.email);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5.5">
      <Heading title={k("emailTitle")}>{k("emailBlurb")}</Heading>

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <AuthInput
            type="email"
            placeholder={t("authPanel.registerEmail")}
            error={errors.email?.message}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            autoFocus
          />
        )}
      />

      <button type="submit" disabled={mutate.isPending} className={SUBMIT_CLASS} style={SUBMIT_STYLE}>
        {mutate.isPending ? k("sending") : k("sendCode")}
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Step 2 — the code                                                           */
/* -------------------------------------------------------------------------- */

function CodeStep({
  email,
  cooldown,
  verify,
  onResend,
  onChangeEmail,
}: {
  email: string;
  cooldown: number;
  verify: ReturnType<typeof useVerifyEmail>;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.verifyEmail.${name}`);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailRequest>({
    resolver: zodResolver(verifyEmailRequestSchema),
    defaultValues: { email, otp: "" },
  });

  // Watched rather than read off the Controller: the submit button lives outside
  // that field's render, and it only needs to know whether the code is complete.
  const code = useWatch({ control, name: "otp" }) ?? "";

  const onSubmit = (data: VerifyEmailRequest) => {
    verify.mutate(data, { onSuccess: () => clearPendingEmail() });
  };

  const submit = handleSubmit(onSubmit);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5.5">
      <div className="flex flex-col gap-4">
        {/* The envelope badge: this screen is a dead stop until a code arrives, so
            it opens with WHERE to look rather than with a field to fill. */}
        <span
          aria-hidden
          className="grid! h-13 w-13 place-items-center rounded-2xl text-primary"
          style={{ background: "rgb(var(--primary__color) / 0.1)" }}
        >
          <MailCheck size={24} />
        </span>

        <Heading title={k("otpTitle")}>
          {k("otpBlurbLead")} <span className="inline! font-semibold! text-panel-fg">{email}</span>.{" "}
          {k("otpBlurbTail")}{" "}
          <button
            type="button"
            onClick={onChangeEmail}
            className="cursor-pointer text-[14px]! font-semibold! text-primary"
          >
            {k("changeEmail")}
          </button>
        </Heading>
      </div>

      <Controller
        name="otp"
        control={control}
        render={({ field }) => (
          <AuthOtpBoxes
            value={field.value}
            onChange={field.onChange}
            // Six digits in means there is nothing left to decide — submit rather
            // than making the user reach for a button they cannot have missed.
            onComplete={() => submit()}
            error={errors.otp?.message}
            disabled={verify.isPending}
            autoFocus
          />
        )}
      />

      {/* Resend, in its own bordered box — it is the escape hatch for the most
          common failure here (the mail never arrived), not a footnote. */}
      <div
        className="flex items-center justify-center rounded-xl border px-4 py-3.5 text-center"
        style={{ borderColor: "var(--panel-border)", background: "var(--panel-field)" }}
      >
        {cooldown > 0 ? (
          <span className="text-[13.5px]! text-panel-muted">
            {k("resendIn")}{" "}
            <strong className="text-[13.5px]! font-bold! tabular-nums text-panel-fg">
              {cooldown}s
            </strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13.5px]! font-semibold! text-primary hover:underline"
          >
            <RotateCcw size={13} strokeWidth={2.5} aria-hidden />
            {k("resend")}
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={verify.isPending || code.length < OTP_LENGTH}
        className={SUBMIT_CLASS}
        style={SUBMIT_STYLE}
      >
        {verify.isPending ? k("verifying") : k("verify")}
      </button>

      <p className="flex items-start justify-center gap-2 text-center text-[12.5px]! leading-relaxed! text-panel-muted">
        <ShieldCheck size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
        {k("securityNote")}
      </p>
    </form>
  );
}

/** The title + blurb pair every step of the auth flows opens with. */
function Heading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
        {title}
      </h1>
      <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">{children}</p>
    </div>
  );
}
