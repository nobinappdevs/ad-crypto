"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useIsClient } from "@/hooks/useIsClient";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSubmit } from "@/components/auth/AuthSubmit";
import { useEmailVerify, useForgotVerifyOtp, useResendEmail, useForgotSendOtp } from "@/hooks/useAuth";
import { readOtpEmail, readOtpOrigin, clearAuthState } from "@/lib/authState";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export function OtpForm() {
  const { t } = useLang();
  const router = useRouter();
  // Anything read from sessionStorage is client-only; gate what we *render* on
  // this so SSR and the hydration paint stay identical.
  const isClient = useIsClient();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  // Flow/origin/email are picked up once from the previous screen — lazy
  // initializers avoid a setState-in-effect.
  const [flow] = useState<"email" | "reset">(() =>
    typeof window !== "undefined" && sessionStorage.getItem("escroc_otp_flow") === "reset"
      ? "reset"
      : "email",
  );
  const [origin] = useState(() => readOtpOrigin());
  const [sentTo] = useState(() => readOtpEmail());
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const emailVerify = useEmailVerify();
  const forgotVerify = useForgotVerifyOtp();
  const resendEmail = useResendEmail();
  const forgotResend = useForgotSendOtp();

  const isVerifying = emailVerify.isPending || forgotVerify.isPending;

  /* countdown timer */
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleResend() {
    setOtp(Array(OTP_LENGTH).fill(""));
    setSeconds(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
    if (flow === "reset") {
      const email = sessionStorage.getItem("escroc_reset_email");
      if (email) forgotResend.mutate(email);
    } else {
      resendEmail.mutate();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;
    if (flow === "reset") {
      const token = sessionStorage.getItem("escroc_reset_token") ?? "";
      forgotVerify.mutate({ otp: code, token });
    } else {
      emailVerify.mutate(code);
    }
  }

  /**
   * Escape hatch for a mistyped email. The half-finished signup still holds a
   * real token, so it has to go — otherwise GuestGuard sees "logged in" and
   * throws the user right back to this screen.
   */
  function handleStartOver() {
    clearAuthState();
    router.replace(origin === "register" ? "/register" : "/login");
  }

  const filled = otp.join("").length;
  const linkClass = "cursor-pointer font-semibold text-primary hover:underline";

  // The reset flow came from /forgot-password and can just go back there. The
  // email flow has no way back at all without this — a typo in the signup
  // address would otherwise strand the user on a code they can never receive.
  const emailFooter =
    origin === "register" ? (
      <>
        {t("auth.wrongEmail")}{" "}
        <button type="button" onClick={handleStartOver} className={linkClass}>
          {t("auth.useDifferentEmail")}
        </button>
      </>
    ) : (
      <button type="button" onClick={handleStartOver} className={linkClass}>
        ← {t("auth.backToLogin")}
      </button>
    );

  return (
    <AuthShell
      title={t("auth.otpTitle")}
      subtitle={
        isClient && sentTo ? (
          <>
            {t("auth.otpSentTo")}{" "}
            <strong className="font-semibold text-heading">{sentTo}</strong>
          </>
        ) : (
          t("auth.otpSubtitle")
        )
      }
      cardLabel={t("auth.otpLabel")}
      footer={
        isClient && flow === "email" ? (
          emailFooter
        ) : (
          <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
            ← {t("auth.backToForgot")}
          </Link>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* OTP boxes — the card header already labels this section */}
        <div>
          <div className="flex gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                aria-label={`${t("auth.digitLabel")} ${i + 1}`}
                /* `border-border`, not a white tint — on the light theme the page
                   background is white too, so a white border is invisible. */
                className={`h-14 w-full rounded-xl border text-center text-xl font-bold text-heading outline-none backdrop-blur-sm transition-all duration-150 focus:ring-2 ${
                  digit
                    ? "border-primary bg-primary/10 text-primary focus:border-primary focus:ring-primary/20"
                    : "border-border bg-white/60 focus:border-primary focus:ring-primary/20 dark:bg-white/5"
                }`}
              />
            ))}
          </div>

          {/* progress bar */}
          <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(filled / OTP_LENGTH) * 100}%` }}
            />
          </div>
        </div>

        {/* Resend */}
        <div className="rounded-xl border border-border bg-white/50 px-4 py-3 text-center text-sm backdrop-blur-sm dark:bg-white/5">
          {seconds > 0 ? (
            <span className="text-muted">
              {t("auth.resendIn")}{" "}
              <strong className="tabular-nums text-heading">{seconds}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <RotateCcw size={13} strokeWidth={2.5} aria-hidden />
              {t("auth.resendOtp")}
            </button>
          )}
        </div>

        <AuthSubmit loading={isVerifying} disabled={filled < OTP_LENGTH}>
          {t("auth.verifyOtp")}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
