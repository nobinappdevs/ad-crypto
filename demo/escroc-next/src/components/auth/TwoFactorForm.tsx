"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSubmit } from "@/components/auth/AuthSubmit";
import { useVerifyGoogle2fa } from "@/hooks/useAuth";
import { clearAuthState } from "@/lib/authState";

const OTP_LENGTH = 6;

/**
 * Login-time Google Authenticator step.
 *
 * Reached when the account has 2FA switched on (`two_factor_status === 1`) but
 * the session hasn't answered a code yet (`two_factor_verified === 0`).
 *
 * The QR and secret deliberately live behind the dashboard's Security page and
 * nowhere near this screen: handing them out here would let anyone who knows
 * the password enrol their own authenticator and clear the very check this
 * screen exists to enforce. Someone who genuinely lost their device needs
 * support to reset it, not a self-service bypass at the login door.
 */
export function TwoFactorForm() {
  const { t } = useLang();
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const verify = useVerifyGoogle2fa();

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;
    verify.mutate(code, { onError: () => setOtp(Array(OTP_LENGTH).fill("")) });
  }

  /** The session is real but unusable until the code lands — signing out is the
      only way back to a different account. */
  function handleSignOut() {
    clearAuthState();
    router.replace("/login");
  }

  const filled = otp.join("").length;

  return (
    <AuthShell
      title={t("auth.twoFaTitle")}
      subtitle={t("auth.twoFaSubtitle")}
      cardLabel={t("auth.twoFaLabel")}
      footer={
        <button
          type="button"
          onClick={handleSignOut}
          className="cursor-pointer font-semibold text-primary hover:underline"
        >
          ← {t("auth.backToLogin")}
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <div className="flex gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus={i === 0}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                aria-label={`${t("auth.digitLabel")} ${i + 1}`}
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

        <AuthSubmit loading={verify.isPending} disabled={filled < OTP_LENGTH}>
          {t("auth.twoFaVerify")}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
