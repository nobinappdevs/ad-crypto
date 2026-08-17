"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useVerify2faOtp } from "@/hooks/useSecurity";
import { verifyCodeRequestSchema, type VerifyCodeRequest } from "@/schemas/auth.schema";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AUTH_SUBMIT_CLASS } from "@/components/auth/AuthField";
import { AuthOtpBoxes, OTP_LENGTH } from "@/components/auth/AuthOtpBoxes";
import { clearAuthState } from "@/lib/authState";

/**
 * The authenticator step between signing in and the dashboard:
 * `POST /user/google-2fa/otp/verify`.
 *
 * No resend and no countdown, unlike the email screens — a TOTP code is generated
 * on the user's own device and rolls over every 30 seconds by itself. There is
 * nothing to ask the server for, so the only escape hatch is signing out.
 *
 * It reuses the same six boxes and the same `code` schema as the email flow: a
 * code screen should look like a code screen wherever it appears.
 */
export function Verify2faForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.verify2fa.${name}`);
  const router = useRouter();

  const verify = useVerify2faOtp(k("verifiedToast"));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeRequest>({
    resolver: zodResolver(verifyCodeRequestSchema),
    defaultValues: { code: "" },
  });

  const code = useWatch({ control, name: "code" }) ?? "";
  const submit = handleSubmit((data) => verify.mutate(data.code));

  /**
   * Lost the authenticator? Then this screen is a dead end, and the token in
   * hand is useless without a code. Dropping the session at least returns the
   * user to a place where support can help, rather than a screen they can't pass.
   */
  function signOut() {
    clearAuthState();
    router.replace("/login");
  }

  return (
    <div style={{ animation: "panel-rise 0.45s ease both" }}>
      <div className="mb-5">
        <AuthBackHome href="/login" labelKey="authPanel.forgotPassword.backToLogin" />
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5.5">
        <div className="flex flex-col gap-4">
          <span
            aria-hidden
            className="grid! h-13 w-13 place-items-center rounded-2xl text-primary"
            style={{ background: "rgb(var(--primary__color) / 0.1)" }}
          >
            <KeyRound size={24} />
          </span>

          <div className="flex flex-col gap-2.5">
            <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
              {k("title")}
            </h1>
            <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">{k("blurb")}</p>
          </div>
        </div>

        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <AuthOtpBoxes
              value={field.value}
              onChange={field.onChange}
              onComplete={() => submit()}
              error={errors.code?.message}
              disabled={verify.isPending}
              autoFocus
            />
          )}
        />

        <button
          type="submit"
          disabled={verify.isPending || code.length < OTP_LENGTH}
          className={AUTH_SUBMIT_CLASS}
        >
          {verify.isPending ? k("verifying") : k("verify")}
        </button>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={signOut}
            className="cursor-pointer text-[13.5px]! font-semibold! text-primary hover:underline"
          >
            {k("signOut")}
          </button>
        </div>

        <p className="flex items-start justify-center gap-2 text-center text-[12.5px]! leading-relaxed! text-panel-muted">
          <ShieldCheck size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          {k("note")}
        </p>
      </form>
    </div>
  );
}
