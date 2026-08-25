"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { MailCheck, RotateCcw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { useResendCode, useVerifyCode } from "@/hooks/useAuth";
import { verifyCodeRequestSchema, type VerifyCodeRequest } from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AUTH_SUBMIT_CLASS } from "@/components/auth/AuthField";
import { AuthOtpBoxes, OTP_LENGTH } from "@/components/auth/AuthOtpBoxes";
import { clearAuthState } from "@/lib/authState";
import { clearPendingEmail, getPendingEmail } from "@/lib/pendingEmail";

/** Seconds the resend link stays disabled after a code goes out. */
const RESEND_COOLDOWN = 60;

/**
 * Email verification for a freshly registered account: `POST /user/verify/code`.
 *
 * One step, not two, because both endpoints behind this screen authenticate with
 * the token register handed out — neither takes an address, so there is nothing
 * for an "which email?" step to submit. `GuestGuard` sends anyone without a token
 * to `/login`, which is why arriving here at all implies there is one.
 *
 * The address is shown from `@/lib/pendingEmail` (register stashed it) purely so
 * the user knows which inbox to open; the request doesn't carry it.
 *
 * The countdown is what makes the resend link honest: without it the only way to
 * find out the link is still rate-limited is to press it and be told off.
 */
export function VerifyEmailForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.verifyEmail.${name}`);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Read once, at mount: the address never changes underneath us.
  const [email] = useState(() => getPendingEmail());
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const resend = useResendCode();
  const verify = useVerifyCode(k("verifiedToast"));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeRequest>({
    resolver: zodResolver(verifyCodeRequestSchema),
    defaultValues: { code: "" },
  });

  // Watched rather than read off the Controller: the submit button lives outside
  // that field's render, and it only needs to know whether the code is complete.
  const code = useWatch({ control, name: "code" }) ?? "";

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submit = handleSubmit((data) => verify.mutate(data.code));

  /**
   * A typo in the sign-up address is otherwise a dead end: the account exists,
   * the code went somewhere unreachable, and no endpoint here can change it. So
   * the way out is to drop the half-made session and register again — leaving the
   * token in place would only have `GuestGuard` bounce them back to this screen.
   */
  function startOver() {
    clearAuthState();
    clearPendingEmail();
    // The abandoned account's cached responses go with its token — the guards read
    // the same `["dashboard"]` entry, and the next account to register in this tab
    // would otherwise be gated on the flags of the one just walked away from.
    queryClient.clear();
    router.replace("/register");
  }

  return (
    <div style={{ animation: "panel-rise 0.45s ease both" }}>
      <div className="mb-5">
        <AuthBackHome href="/login" labelKey="authPanel.forgotPassword.backToLogin" />
      </div>

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

          <div className="flex flex-col gap-2.5">
            <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
              {k("otpTitle")}
            </h1>
            <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
              {k("otpBlurbLead")}{" "}
              <span className="inline! font-semibold! text-panel-fg">
                {email || k("yourEmail")}
              </span>
              . {k("otpBlurbTail")}{" "}
              <button
                type="button"
                onClick={startOver}
                className="cursor-pointer text-[14px]! font-semibold! text-primary"
              >
                {k("changeEmail")}
              </button>
            </p>
          </div>
        </div>

        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <AuthOtpBoxes
              value={field.value}
              onChange={field.onChange}
              // Six digits in means there is nothing left to decide — submit rather
              // than making the user reach for a button they cannot have missed.
              onComplete={() => submit()}
              error={errors.code?.message}
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
              onClick={() =>
                resend.mutate(undefined, {
                  // Only start the countdown on a send that actually happened —
                  // the backend has a cooldown of its own and says so on refusal.
                  onSuccess: () => {
                    toast.success(k("resendSuccessToast"));
                    setCooldown(RESEND_COOLDOWN);
                  },
                })
              }
              disabled={resend.isPending}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[13.5px]! font-semibold! text-primary hover:underline disabled:cursor-default disabled:text-panel-muted"
            >
              <RotateCcw size={13} strokeWidth={2.5} aria-hidden />
              {resend.isPending ? k("sending") : k("resend")}
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={verify.isPending || code.length < OTP_LENGTH}
          className={AUTH_SUBMIT_CLASS}
        >
          {verify.isPending ? k("verifying") : k("verify")}
        </button>

        <p className="flex items-start justify-center gap-2 text-center text-[12.5px]! leading-relaxed! text-panel-muted">
          <ShieldCheck size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          {k("securityNote")}
        </p>
      </form>
    </div>
  );
}
