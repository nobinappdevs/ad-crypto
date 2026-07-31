"use client";

import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLang } from "@/hooks/useLang";
import { useLogin } from "@/hooks/useAuth";
import { loginRequestSchema, type LoginRequest } from "@/schemas/auth.schema";
import { ThemeToggle } from "@/components/share/ThemeToggle";
import { PromoPanel } from "@/components/promo/PromoPanel";

/**
 * The auth panel: shared promo half on the left, log-in / register form on the
 * right, at the design's 1fr / 1.06fr split from `lg` up and stacked below it.
 *
 * The form column is keyed on the mode, so switching tabs remounts it and the
 * `panel-rise` animation replays — that replay is the mock's own behaviour, not an
 * addition. React-hook-form's state lives outside that subtree, so the values
 * survive the remount.
 *
 * Log-in is wired to the real endpoint (the page it replaces was). Register has no
 * endpoint yet, so its CTA is inert exactly as in the design; the field errors
 * below only ever appear on a failed submit, so the resting design is unchanged.
 */
const STATS = ["deposit", "spot", "futures"] as const;

const FIELD_CLASS =
  "w-full rounded-xl border border-panel-line px-4.5 py-4 text-[14.5px] text-panel-fg outline-none transition-[border-color,box-shadow] duration-[250ms] placeholder:text-panel-muted focus:border-primary focus:shadow-[0_0_0_4px_rgb(1_148_252_/_0.14)]";

const FIELD_STYLE = { background: "var(--panel-field)" };

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A9.6 9.6 0 0112 6c6 0 9.5 6 9.5 6a17 17 0 01-3.4 4.1M6.4 7.9A17 17 0 002.5 12s3.5 6 9.5 6a9.4 9.4 0 003.6-.7" />
          <path d="M9.8 9.9a3.2 3.2 0 004.4 4.4" />
        </>
      ) : (
        <>
          <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="3.2" />
        </>
      )}
    </svg>
  );
}

export function AuthPanel() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.${name}`);
  const login = useLogin();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const isLogin = mode === "login";

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data, {
      onError: (err) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldErrors = (err as any)?.response?.data?.errors;
        if (!fieldErrors) return;
        (["email", "password"] as const).forEach((field) => {
          const msg = fieldErrors[field]?.[0];
          if (msg) setError(field, { type: "server", message: msg });
        });
      },
    });
  };

  const tab = (target: "login" | "register", label: string) => {
    const on = mode === target;
    return (
      <button
        type="button"
        onClick={() => setMode(target)}
        className="cursor-pointer border-b-2 pb-2 text-[15px] font-semibold transition-[color,border-color] duration-300"
        style={{
          color: on ? "rgb(var(--panel-fg))" : "var(--panel-muted)",
          borderColor: on ? "rgb(var(--primary__color))" : "transparent",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8 sm:px-6 sm:py-11" style={{ background: "var(--suite-bg)" }}>
      <div
        className="relative grid w-full max-w-280 grid-cols-1 overflow-hidden rounded-[30px] border border-panel-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]"
        style={{ background: "var(--panel-bg)", boxShadow: "var(--panel-shadow)" }}
      >
        <div className="absolute top-4 right-4 z-[4] sm:top-6 sm:right-6">
          <ThemeToggle variant="panel" />
        </div>

        <PromoPanel baseKey="authPanel" stats={STATS} floorClass="lg:min-h-165" />

        <div className="flex flex-col justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-15.5 lg:pt-14.5 lg:pb-12">
          <form
            key={mode}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5.5"
            style={{ animation: "panel-rise 0.45s ease both" }}
          >
            <div className="flex items-center gap-6">
              {tab("login", k("tabLogin"))}
              {tab("register", k("tabRegister"))}
            </div>

            <div className="flex flex-col gap-2.5">
              <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
                {isLogin ? k("loginTitle") : k("registerTitle")}
              </h1>
              <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
                {isLogin ? k("loginBlurb") : k("registerBlurb")}
              </p>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder={k("firstName")}
                  className={FIELD_CLASS}
                  style={FIELD_STYLE}
                />
                <input
                  type="text"
                  placeholder={k("lastName")}
                  className={FIELD_CLASS}
                  style={FIELD_STYLE}
                />
              </div>
            )}

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div>
                  <input
                    type="email"
                    placeholder={isLogin ? k("loginEmail") : k("registerEmail")}
                    className={FIELD_CLASS}
                    style={FIELD_STYLE}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  {errors.email?.message && (
                    <span className="mt-1.5 text-[12.5px]! text-[#d4483f]">
                      {errors.email.message}
                    </span>
                  )}
                </div>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <div>
                  <div className="relative flex items-center">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder={isLogin ? k("loginPassword") : k("registerPassword")}
                      className={`${FIELD_CLASS} pr-13`}
                      style={FIELD_STYLE}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      title={k("showPassword")}
                      aria-label={k("showPassword")}
                      className="absolute right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-[9px] text-panel-muted transition-colors duration-[250ms] hover:text-primary"
                    >
                      <EyeIcon off={!showPw} />
                    </button>
                  </div>
                  {errors.password?.message && (
                    <span className="mt-1.5 text-[12.5px]! text-[#d4483f]">
                      {errors.password.message}
                    </span>
                  )}
                </div>
              )}
            />

            {!isLogin && (
              <label className="flex cursor-pointer items-center gap-2.75 text-[13.5px]! text-panel-muted">
                <span
                  onClick={() => setTerms((v) => !v)}
                  className="grid! h-5 w-5 shrink-0 place-items-center rounded-md border transition-[background,border-color] duration-[250ms]"
                  style={{
                    borderColor: terms ? "rgb(var(--primary__color))" : "var(--panel-border)",
                    background: terms ? "rgb(var(--primary__color))" : "transparent",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: terms ? 1 : 0 }}
                    aria-hidden
                  >
                    <path d="M4.5 12.5l5 5 10-11" />
                  </svg>
                </span>
                <span className="text-[13.5px]! text-panel-muted">
                  {k("termsLead")}{" "}
                  <Link href="#" className="inline! text-[13.5px]! text-primary">
                    {k("termsLink")}
                  </Link>
                </span>
              </label>
            )}

            {isLogin && (
              <div className="flex justify-end">
                <Link href="#" className="text-[13.5px]! font-semibold! text-primary">
                  {k("forgot")}
                </Link>
              </div>
            )}

            <button
              type={isLogin ? "submit" : "button"}
              disabled={isLogin && login.isPending}
              className="mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252_/_0.44)] disabled:cursor-default disabled:hover:translate-y-0"
              style={{ boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" }}
            >
              {isLogin
                ? login.isPending
                  ? t("auth.loggingIn")
                  : k("loginCta")
                : k("registerCta")}
            </button>

            <div className="flex justify-center gap-1.5 text-[13.5px]! text-panel-muted">
              <span className="text-[13.5px]! text-panel-muted">
                {isLogin ? k("loginPrompt") : k("registerPrompt")}
              </span>
              <button
                type="button"
                onClick={() => setMode(isLogin ? "register" : "login")}
                className="cursor-pointer text-[13.5px] font-bold text-primary"
              >
                {isLogin ? k("loginAction") : k("registerAction")}
              </button>
            </div>

            <div className="mt-0.5 flex items-center gap-3.5">
              <span aria-hidden className="h-px flex-1 bg-panel-line" />
              <span className="text-[12px]! text-panel-muted">{k("divider")}</span>
              <span aria-hidden className="h-px flex-1 bg-panel-line" />
            </div>

            <div className="flex justify-center gap-3.5">
              <button
                type="button"
                title="Apple"
                aria-label="Apple"
                className="grid h-11.5 w-13 cursor-pointer place-items-center rounded-[13px] border border-panel-line text-panel-fg transition-[transform,border-color] duration-[250ms] hover:-translate-y-0.75 hover:border-primary"
                style={FIELD_STYLE}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.6 2.2 2.8 2.2 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.8.7 1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1-1.8-.1 0-2-.8-2-3zM14 5.4c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" />
                </svg>
              </button>
              <button
                type="button"
                title="Google"
                aria-label="Google"
                className="grid h-11.5 w-13 cursor-pointer place-items-center rounded-[13px] border border-panel-line transition-[transform,border-color] duration-[250ms] hover:-translate-y-0.75 hover:border-primary"
                style={FIELD_STYLE}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0012 22z"
                  />
                  <path fill="#FBBC05" d="M6.4 13.9a6 6 0 010-3.8V7.5H3.1a10 10 0 000 9l3.3-2.6z" />
                  <path
                    fill="#EA4335"
                    d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 003.1 7.5l3.3 2.6C7.2 7.6 9.4 5.9 12 5.9z"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
