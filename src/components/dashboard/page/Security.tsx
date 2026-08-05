"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "react-qr-code";
import {
  Apple,
  Check,
  Copy,
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { AUTHENTICATOR_APPS, SETUP_STEPS, TWO_FA, groupSecret, otpauthUri } from "@/config/security";

const CODE_LENGTH = 6;

/**
 * Google Authenticator's asterisk mark, drawn rather than fetched: six arms of one
 * rounded bar rotated around the centre. A remote logo would be one network round
 * trip and one third-party host for a 96px decoration.
 */
function AuthenticatorLogo() {
  const arms = [
    { rotate: 0, fill: "#EA4335" },
    { rotate: 60, fill: "#4285F4" },
    { rotate: 120, fill: "#FBBC05" },
    { rotate: 180, fill: "#EA4335" },
    { rotate: 240, fill: "#34A853" },
    { rotate: 300, fill: "#4285F4" },
  ];

  return (
    <svg viewBox="0 0 96 96" width={84} height={84} aria-hidden>
      {arms.map(({ rotate, fill }) => (
        <rect
          key={rotate}
          x="42"
          y="8"
          width="12"
          height="38"
          rx="6"
          fill={fill}
          transform={`rotate(${rotate} 48 48)`}
        />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Two-factor setup: the shared secret in three forms — as text to type, as a QR to
 * scan, and as the switch that turns it on.
 *
 * All three are on screen at once rather than behind a wizard, because which one a
 * user needs depends on where their authenticator is: a phone scans, a desktop app
 * gets the key pasted. Hiding either behind a step forces half of them to hunt.
 *
 * Enrolment state is local: there is no backend yet (see `@/config/env`), so the
 * toggle stands in for `POST .../google-2fa/status/update` and the demo secret
 * comes from `@/config/security`. The confirmation dialog still demands a live code
 * before flipping either way, which is the part that matters — enabling 2FA against
 * an authenticator that was never actually enrolled locks the account out, and
 * disabling it without proof is a takeover.
 */
export function Security() {
  const { t } = useLang();
  const k = (name: string) => t(`twoFa.${name}`);

  const [enabled, setEnabled] = useState(TWO_FA.status === 1);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [code, setCode] = useState("");

  // One timer, cleaned up on unmount: the tick would otherwise set state on a
  // component that is gone if the user navigates away right after copying.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(TWO_FA.secret);
      setCopied(true);
    } catch {
      toast.error(k("copyFailed"));
    }
  }

  function confirmToggle() {
    if (code.length < CODE_LENGTH) return;
    setEnabled((on) => !on);
    setConfirmOpen(false);
    setCode("");
    toast.success(k(enabled ? "disabledToast" : "enabledToast"));
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={k("title")}
        subtitle={k("subtitle")}
        action={
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
            <span
              aria-hidden
              className={cn(
                "grid! h-7 w-7 place-items-center rounded-lg",
                enabled
                  ? "bg-hero-mint/12 text-hero-mint"
                  : "bg-amber-500/12 text-amber-600 dark:text-amber-400",
              )}
            >
              {enabled ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
            </span>
            <span className="min-w-0">
              <span className="block text-[12px]! text-muted">{k("statusLabel")}</span>
              <span className="block text-[13px]! font-bold!">
                {k(enabled ? "statusOn" : "statusOff")}
              </span>
            </span>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Setup ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid! h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"
            >
              <KeyRound size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[16px]! leading-tight! font-bold!">{k("setupTitle")}</h2>
              <p className="mt-1 text-[12.5px]! text-muted">{k("setupHint")}</p>
            </div>
          </div>

          {/* Status banner — the one line that answers "am I protected right now?" */}
          <div
            className={cn(
              "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5",
              enabled
                ? "border-hero-mint/25 bg-hero-mint/8"
                : "border-amber-500/25 bg-amber-500/8",
            )}
          >
            {enabled ? (
              <ShieldCheck size={17} aria-hidden className="mt-px shrink-0 text-hero-mint" />
            ) : (
              <ShieldAlert
                size={17}
                aria-hidden
                className="mt-px shrink-0 text-amber-600 dark:text-amber-400"
              />
            )}
            <p
              className={cn(
                "text-[13px]! leading-relaxed! font-medium!",
                enabled ? "text-hero-mint" : "text-amber-700 dark:text-amber-400",
              )}
            >
              {k(enabled ? "bannerOn" : "bannerOff")}
            </p>
          </div>

          {/* Secret key, for authenticators that are typed into rather than scanned */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[13px] font-semibold text-heading">{k("secretLabel")}</span>
              <span className="text-[11.5px]! text-muted">{k("secretHint")}</span>
            </div>
            <div className="flex h-13 overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
              {/* Read-only input rather than a `<p>`: it stays selectable and
                  keyboard-reachable, which is how a user copies it without the
                  clipboard API (blocked over plain HTTP, among other places). */}
              <input
                readOnly
                value={groupSecret(TWO_FA.secret)}
                aria-label={k("secretLabel")}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 cursor-default bg-transparent px-3.5 font-mono text-[13.5px] font-semibold tracking-wide text-heading outline-none"
              />
              <button
                type="button"
                onClick={copySecret}
                aria-label={copied ? k("copied") : k("copy")}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-1.5 border-s border-border px-4 text-[13px] font-semibold transition",
                  copied
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-primary/10 hover:text-primary",
                )}
              >
                {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} />}
                <span className="hidden sm:inline">{copied ? k("copied") : k("copy")}</span>
              </button>
            </div>
          </div>

          {/* QR — rendered locally from the same secret shown above */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[13px] font-semibold text-heading">{k("qrLabel")}</span>
              <span className="text-[11.5px]! text-muted">{k("qrHint")}</span>
            </div>
            <div className="flex justify-center rounded-2xl border border-border bg-surface p-4 sm:p-6">
              {/* White plate under the code regardless of theme: a QR inverted for
                  a dark background is unreadable to a good half of scanners. */}
              <div className="rounded-xl bg-white p-3.5 shadow-[0_10px_30px_rgb(2_10_22/0.12)] sm:p-4">
                <QRCode
                  value={otpauthUri()}
                  size={196}
                  bgColor="#ffffff"
                  fgColor="#091628"
                  className="h-auto! w-full! max-w-49"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCode("");
              setConfirmOpen(true);
            }}
            className={cn(
              "mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:opacity-95",
              enabled
                ? "bg-hero-neg shadow-[0_12px_28px_rgb(var(--hero-neg)/0.32)]"
                : "bg-primary shadow-[0_12px_28px_rgb(var(--primary__color)/0.35)]",
            )}
          >
            {enabled ? <Shield size={16} aria-hidden /> : <ShieldCheck size={16} aria-hidden />}
            {k(enabled ? "disableCta" : "enableCta")}
          </button>
        </Panel>

        {/* ------------------------- App + steps ------------------------- */}
        <div className="grid grid-cols-1 gap-5 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="grid! h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"
              >
                <Smartphone size={17} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px]! leading-tight! font-bold!">{k("appTitle")}</h2>
                <p className="mt-1 text-[12.5px]! leading-relaxed! text-muted">{k("appDesc")}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="grid h-30 w-30 place-items-center rounded-2xl border border-border bg-white">
                <AuthenticatorLogo />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href={AUTHENTICATOR_APPS.android}
                target="_blank"
                rel="noopener noreferrer"
                className="flex! h-12 items-center justify-center gap-2.5 rounded-xl bg-primary text-[14px] font-bold text-white! transition hover:opacity-90"
              >
                {/* Play store triangle — lucide has no store marks. */}
                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden>
                  <path d="M3 20.5v-17c0-.83 1-.83 1.5-.5l14 8.5c.5.3.5 1 0 1.3L4.5 21c-.5.33-1.5.33-1.5-.5z" />
                </svg>
                {k("getAndroid")}
              </a>
              <a
                href={AUTHENTICATOR_APPS.ios}
                target="_blank"
                rel="noopener noreferrer"
                className="flex! h-12 items-center justify-center gap-2.5 rounded-xl border border-border bg-surface text-[14px] font-bold text-heading! transition hover:border-primary hover:text-primary!"
              >
                <Apple size={15} aria-hidden />
                {k("getIos")}
              </a>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-6">
            <h2 className="text-[16px]! font-bold!">{k("stepsTitle")}</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {SETUP_STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="grid! h-6.5 w-6.5 shrink-0 place-items-center rounded-lg bg-primary/12 text-[12px]! font-bold! text-primary"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-heading">
                      {k(`steps.${step}.title`)}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                      {k(`steps.${step}.body`)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="mt-5 rounded-xl bg-primary/8 px-3 py-2.5 text-[12px]! leading-relaxed! text-muted">
              {k("backupNote")}
            </p>
          </Panel>
        </div>
      </div>

      {/* Portalled to <body>, like the logout dialog: inside a panel it would be
          clipped by the card's own `overflow-hidden`. */}
      {confirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-card"
            >
              <span
                aria-hidden
                className={cn(
                  "mx-auto grid! h-12 w-12 place-items-center rounded-full",
                  enabled ? "bg-hero-neg/10 text-hero-neg" : "bg-primary/10 text-primary",
                )}
              >
                {enabled ? <Shield size={20} /> : <ShieldCheck size={20} />}
              </span>

              <h2 className="mt-4 text-[17px]! font-bold!">
                {k(enabled ? "confirmDisableTitle" : "confirmEnableTitle")}
              </h2>
              <p className="mt-1.5 text-[13px]! leading-relaxed! text-muted">
                {k(enabled ? "confirmDisableDesc" : "confirmEnableDesc")}
              </p>

              <div className="mt-5 text-start">
                <label
                  htmlFor="twofa-code"
                  className="mb-2 block text-[13px] font-semibold text-heading"
                >
                  {k("codeLabel")}
                  <span aria-hidden className="inline! text-hero-neg">
                    {" *"}
                  </span>
                </label>
                <input
                  id="twofa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmToggle();
                  }}
                  placeholder="000000"
                  className="h-13 w-full rounded-xl border border-border bg-surface text-center font-mono text-[20px] tracking-[0.45em] text-heading outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1.5 text-[11.5px]! text-muted">{k("codeHint")}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-heading transition hover:bg-black/4 dark:hover:bg-white/5"
                >
                  {t("dashboard.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmToggle}
                  disabled={code.length < CODE_LENGTH}
                  className={cn(
                    "flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                    enabled ? "bg-hero-neg hover:opacity-90" : "bg-primary hover:opacity-90",
                  )}
                >
                  {k(enabled ? "confirmDisableCta" : "confirmEnableCta")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
