"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Reusable Google reCAPTCHA v2 checkbox.
 *
 * Usage (see LoginForm): gate visibility with `useRecaptcha().enabled`, pass the
 * `siteKey`, and read the token via `onVerify`. To clear the widget after a
 * failed submit (reCAPTCHA tokens are single-use), bump `resetSignal`.
 */

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => number;
      reset: (id?: number) => void;
      ready?: (cb: () => void) => void;
    };
  }
}

// Load the Google reCAPTCHA API once (explicit-render mode), shared across mounts.
let scriptPromise: Promise<void> | null = null;
function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha?.render) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function Recaptcha({ siteKey, onVerify, resetSignal = 0, className = "" }: {
  siteKey: string;
  onVerify: (token: string) => void;
  /** Increment to clear the widget (e.g. after a failed submit). */
  resetSignal?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const { theme } = useTheme();

  // Keep the latest onVerify without forcing the widget to re-render.
  const onVerifyRef = useRef(onVerify);
  useEffect(() => {
    onVerifyRef.current = onVerify;
  });

  useEffect(() => {
    let cancelled = false;
    loadRecaptchaScript()
      .then(() => {
        const g = window.grecaptcha;
        const render = () => {
          if (cancelled || !g?.render || !containerRef.current || widgetId.current !== null) return;
          widgetId.current = g.render(containerRef.current, {
            sitekey: siteKey,
            theme: theme === "dark" ? "dark" : "light",
            callback: (token: string) => onVerifyRef.current(token),
            "expired-callback": () => onVerifyRef.current(""),
            "error-callback": () => onVerifyRef.current(""),
          });
        };
        if (g?.ready) g.ready(render);
        else render();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Re-render only when the site key changes; theme is read at mount time.
  }, [siteKey, theme]);

  // Reset the widget whenever the parent bumps resetSignal (skip the first run).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (widgetId.current !== null) window.grecaptcha?.reset(widgetId.current);
  }, [resetSignal]);

  return <div ref={containerRef} className={className} />;
}
