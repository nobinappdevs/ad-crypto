"use client";

import { useState } from "react";
import { useLang } from "@/hooks/useLang";

export const FIELD_CLASS =
  "w-full rounded-xl border border-panel-line px-4.5 py-4 text-[14.5px] text-panel-fg outline-none transition-[border-color,box-shadow] duration-[250ms] placeholder:text-panel-muted focus:border-primary focus:shadow-[0_0_0_4px_rgb(1_148_252_/_0.14)]";

export const FIELD_STYLE = { background: "var(--panel-field)" };

/** Plain text input in the panel's field style, with an optional error line. */
export function AuthInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input className={FIELD_CLASS} style={FIELD_STYLE} {...props} />
      {error && <span className="mt-1.5 block text-[12.5px]! text-[#d4483f]">{error}</span>}
    </div>
  );
}

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

/** Password input with the show/hide toggle — the one field both forms need
 *  more than a plain `AuthInput`. */
export function AuthPasswordInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="relative flex items-center">
        <input
          type={show ? "text" : "password"}
          className={`${FIELD_CLASS} pr-13`}
          style={FIELD_STYLE}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          title={t("authPanel.showPassword")}
          aria-label={t("authPanel.showPassword")}
          className="absolute right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-[9px] text-panel-muted transition-colors duration-[250ms] hover:text-primary"
        >
          <EyeIcon off={!show} />
        </button>
      </div>
      {error && <span className="mt-1.5 block text-[12.5px]! text-[#d4483f]">{error}</span>}
    </div>
  );
}
