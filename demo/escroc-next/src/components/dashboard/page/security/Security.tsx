"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Check, Shield, ShieldCheck, Apple } from "lucide-react";
import { Panel, PanelHeader, dsx } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";
import { useGoogle2fa, useUpdate2faStatus } from "@/hooks/useSecurity";

/* Google Authenticator colorful asterisk logo */
function GALogo() {
  return (
    <svg viewBox="0 0 96 96" width={96} height={96} aria-hidden>
      {/* red arm */}
      <rect x="42" y="8"  width="12" height="38" rx="6" fill="#EA4335" transform="rotate(0   48 48)" />
      {/* blue arm */}
      <rect x="42" y="8"  width="12" height="38" rx="6" fill="#4285F4" transform="rotate(60  48 48)" />
      {/* yellow arm */}
      <rect x="42" y="8"  width="12" height="38" rx="6" fill="#FBBC05" transform="rotate(120 48 48)" />
      {/* red arm bottom */}
      <rect x="42" y="50" width="12" height="38" rx="6" fill="#EA4335" transform="rotate(0   48 48)" />
      {/* green arm */}
      <rect x="42" y="8"  width="12" height="38" rx="6" fill="#34A853" transform="rotate(240 48 48)" />
      {/* blue arm bottom */}
      <rect x="42" y="8"  width="12" height="38" rx="6" fill="#4285F4" transform="rotate(300 48 48)" />
    </svg>
  );
}

/* The endpoint returns the QR as a full SVG document (it used to return a URL).
   Wrapping the markup in a data URI keeps it an <img>: an SVG loaded that way is
   rendered without scripting, so response markup can't execute anything. A plain
   URL is passed through untouched. */
const qrSrcFrom = (qr: string) =>
  qr.trimStart().startsWith("<") ? `data:image/svg+xml;utf8,${encodeURIComponent(qr)}` : qr;

/* ───────────────────────── loading skeleton ───────────────────────── */

function SkLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

function SecuritySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      {/* left: 2FA setup */}
      <Panel>
        <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><SkLine className="h-4 w-48" /></div>
        <div className="p-4 sm:p-6">
          <SkLine className="mb-6 h-14 w-full rounded-xl" />
          <SkLine className="mb-2 h-3 w-40" />
          <SkLine className="mb-6 h-11 w-full rounded-xl" />
          <div className="mb-6 flex justify-center">
            <SkLine className="h-63 w-63 rounded-2xl" />
          </div>
          <SkLine className="h-12 w-full rounded-xl" />
        </div>
      </Panel>

      {/* right: authenticator info */}
      <Panel>
        <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><SkLine className="h-4 w-40" /></div>
        <div className="p-4 sm:p-6">
          <SkLine className="mb-2 h-3 w-full" />
          <SkLine className="mb-6 h-3 w-2/3" />
          <div className="mb-6 flex justify-center">
            <SkLine className="h-36 w-36 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-3">
            <SkLine className="h-12 w-full rounded-xl" />
            <SkLine className="h-12 w-full rounded-xl" />
          </div>
          <SkLine className="mt-6 h-32 w-full rounded-xl" />
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── component ───────────────────────── */

export function Security() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const { data: res, isLoading } = useGoogle2fa();
  const twoFa = (res as any)?.data;
  const secret: string = twoFa?.qr_secrete ?? "";
  const qrCode: string = twoFa?.qr_code ?? "";
  const qrSrc = qrCode ? qrSrcFrom(qrCode) : "";
  const enabled = twoFa?.qr_status === 1;

  const update2fa = useUpdate2faStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [code, setCode] = useState("");

  const openConfirm = () => {
    setCode("");
    setConfirmOpen(true);
  };

  const confirmToggle = () => {
    if (code.length !== 6) return;
    update2fa.mutate(
      { status: enabled ? 0 : 1, code },
      { onSuccess: () => { setConfirmOpen(false); setCode(""); } },
    );
  };

  const setupSteps = [
    t("dashboard.security.step1"),
    t("dashboard.security.step2"),
    t("dashboard.security.step3"),
    t("dashboard.security.step4"),
  ];

  const handleCopy = () => {
    navigator.clipboard?.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Full-page skeleton while the 2FA data loads for the first time.
  if (isLoading && !twoFa) return <SecuritySkeleton />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

      {/* ── left: 2FA setup ── */}
      <Panel>
        <PanelHeader title={t("dashboard.security.twoFactorTitle")}>
          {enabled && (
            <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <ShieldCheck size={13} strokeWidth={2.5} aria-hidden />
              {t("dashboard.security.enabledBadge")}
            </span>
          )}
        </PanelHeader>

        <div className="p-4 sm:p-6">
          {/* status banner */}
          {enabled ? (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
              <ShieldCheck size={18} strokeWidth={2} className="shrink-0 text-primary" aria-hidden />
              <p className="text-sm flex items-center gap-x-1.5 font-medium text-primary">
                {t("dashboard.security.activeBannerPre")}{" "}
                <span className="font-bold">{t("dashboard.security.activeBannerWord")}</span>{" "}
                {t("dashboard.security.activeBannerPost")}
              </p>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3.5">
            
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {t("dashboard.security.notProtectedBanner")}
              </p>
            </div>
          )}

          {/* secret key */}
          <div className="mb-6 flex flex-col gap-1.5">
            <label className="text-xs flex gap-x-1.5 font-semibold uppercase tracking-wide text-muted">
              {t("dashboard.security.secretKeyLabel")} <span className="text-amber-500">*</span>
            </label>
            <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
              <input
                readOnly
                value={secret}
                className="min-w-0 flex-1 cursor-default bg-transparent px-4 font-mono text-sm font-medium text-heading outline-none"
              />
              <button
                onClick={handleCopy}
                className={`cursor-pointer flex shrink-0 items-center gap-1.5 border-l border-border px-4 text-sm font-semibold transition ${
                  copied
                    ? "bg-primary/10 text-primary"
                    : "bg-surface text-muted hover:bg-primary/10 hover:text-primary"
                }`}
                aria-label={copied ? t("dashboard.security.copied") : t("dashboard.security.copySecretKey")}
              >
                {copied ? <Check size={15} strokeWidth={2.5} aria-hidden /> : <Copy size={15} strokeWidth={2} aria-hidden />}
              </button>
            </div>
            <p className="text-xs text-muted">
              {t("dashboard.security.secretKeyHelp")}
            </p>
          </div>

          {/* QR code */}
          <div className="mb-6 flex justify-center">
            <div className="overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- data-URI QR in a static-export app
                <img src={qrSrc} alt={t("dashboard.security.qrAlt")} width={252} height={252} className="h-63 w-63 max-w-full" />
              ) : (
                <div className="h-63 w-63 animate-pulse rounded-lg bg-border" />
              )}
            </div>
          </div>

          {/* enable / disable */}
          <button
            onClick={openConfirm}
            disabled={update2fa.isPending || !secret}
            className={`cursor-pointer flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60 ${
              enabled
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {enabled ? (
              <><Shield size={17} strokeWidth={2.5} aria-hidden /> {t("dashboard.security.disable2fa")}</>
            ) : (
              <><ShieldCheck size={17} strokeWidth={2.5} aria-hidden /> {t("dashboard.security.enable")}</>
            )}
          </button>
        </div>
      </Panel>

      {/* ── right: Google Authenticator info ── */}
      <Panel>
        <PanelHeader title={t("dashboard.security.googleAuthTitle")} />

        <div className="p-4 sm:p-6">
          {/* description */}
          <p className="mb-1 text-sm leading-relaxed text-body">
            {t("dashboard.security.googleAuthDesc")}{" "}
            <a href="#" className="font-semibold text-primary underline-offset-2 hover:underline">
              {t("dashboard.security.howToSetup")}
            </a>
          </p>

          {/* app logo */}
          <div className="my-6 flex justify-center">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <GALogo />
            </div>
          </div>

          {/* download buttons */}
          <div className="flex flex-col gap-3">
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
              target="_blank"
              className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              {/* play store triangle */}
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden>
                <path d="M3 20.5v-17c0-.83 1-.83 1.5-.5l14 8.5c.5.3.5 1 0 1.3L4.5 21c-.5.33-1.5.33-1.5-.5z" />
              </svg>
              {t("dashboard.security.downloadAndroid")}
            </a>
            <a
              href="https://apps.apple.com/us/app/google-authenticator/id388497605"
               target="_blank"
              className="flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              <Apple size={16} strokeWidth={2} aria-hidden />
              {t("dashboard.security.downloadIos")}
            </a>
          </div>

          {/* steps */}
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{t("dashboard.security.setupSteps")}</p>
            <ol className="flex flex-col gap-2.5">
              {setupSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-body">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Panel>

      {/* Enable / disable confirmation — portalled to <body> to overlay everything. */}
      {confirmOpen && createPortal(
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { if (!update2fa.isPending) setConfirmOpen(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
          >
            <div
              className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${
                enabled ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
              }`}
            >
              {enabled
                ? <Shield size={22} strokeWidth={2} aria-hidden />
                : <ShieldCheck size={22} strokeWidth={2} aria-hidden />}
            </div>
            <h3 className="mt-4 text-lg font-bold text-heading">
              {enabled ? t("dashboard.security.disableTitle") : t("dashboard.security.enableTitle")}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {enabled ? t("dashboard.security.disableDesc") : t("dashboard.security.enableDesc")}
            </p>

            {/* authenticator code */}
            <div className="mt-5 flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold flex gap-x-1.5 uppercase tracking-wide text-muted">
                {t("dashboard.security.authCodeLabel")} <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => { if (e.key === "Enter" && code.length === 6 && !update2fa.isPending) confirmToggle(); }}
                placeholder="000000"
                className="h-12 w-full rounded-xl border border-border bg-surface text-center font-mono text-lg tracking-[0.5em] text-heading outline-none transition placeholder:tracking-[0.5em] placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="text-xs text-muted">{t("dashboard.security.authCodeHelp")}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={update2fa.isPending}
                className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
              >
                {t("dashboard.security.cancel")}
              </button>
              <Button
                variant={enabled ? "danger" : "primary"}
                size="md"
                fullWidth
                loading={update2fa.isPending}
                disabled={code.length !== 6}
                onClick={confirmToggle}
                className="flex-1"
              >
                {enabled ? t("dashboard.security.disable2fa") : t("dashboard.security.enable")}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
