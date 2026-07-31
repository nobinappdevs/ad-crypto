"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { AuthBackHome } from "@/components/auth/AuthBackHome";
import { AuthInput, AuthPasswordInput } from "@/components/auth/AuthField";

/**
 * The right-hand column on `/register`. There is no registration endpoint yet —
 * same as in the source design, where this CTA was never wired to a mutation
 * either — so the button is inert and the fields are uncontrolled. Wire it up the
 * same way `LoginForm` is wired once the endpoint exists.
 */
export function RegisterForm() {
  const { t } = useLang();
  const k = (name: string) => t(`authPanel.${name}`);
  const [terms, setTerms] = useState(false);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="flex flex-col gap-5.5"
      style={{ animation: "panel-rise 0.45s ease both" }}
    >
      <AuthBackHome />

      <div className="flex flex-col gap-2.5">
        <h1 className="text-[26px]! leading-[1.14]! font-bold! tracking-[-0.03em] text-panel-fg sm:text-[30px]! lg:text-[34px]!">
          {k("registerTitle")}
        </h1>
        <p className="max-w-110 text-[14px]! leading-[1.7]! text-panel-muted">
          {k("registerBlurb")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <AuthInput type="text" placeholder={k("firstName")} />
        <AuthInput type="text" placeholder={k("lastName")} />
      </div>

      <AuthInput type="email" placeholder={k("registerEmail")} />
      <AuthPasswordInput placeholder={k("registerPassword")} />

      {/* onClick lives on the label, not the checkbox glyph — the glyph is the
          only thing that used to toggle it, so clicking "I have agreed with"
          did nothing. The Terms link stops the click from bubbling up to the
          label, so following it doesn't also flip the checkbox underneath it. */}
      <label
        onClick={() => setTerms((v) => !v)}
        className="flex cursor-pointer items-center gap-2.75 text-[13.5px]! text-panel-muted"
      >
        <span
          aria-hidden
          className="grid! h-5 w-5 shrink-0 place-items-center rounded-md border transition-[background,border-color] duration-250"
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
          <Link
            href="#"
            onClick={(e) => e.stopPropagation()}
            className="inline! text-[13.5px]! text-primary"
          >
            {k("termsLink")}
          </Link>
        </span>
      </label>

      <button
        type="submit"
        className="mt-1 cursor-pointer rounded-full bg-primary py-4.25 text-[15.5px] font-bold text-white transition-[transform,box-shadow] duration-250 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgb(1_148_252/0.44)]"
        style={{ boxShadow: "0 16px 34px rgb(1 148 252 / 0.34)" }}
      >
        {k("registerCta")}
      </button>

      <p className="text-center text-[13.5px]! text-panel-muted">
        {k("registerPrompt")}{" "}
        <Link href="/login" className="inline! font-bold! text-primary">
          {k("registerAction")}
        </Link>
      </p>
    </form>
  );
}
