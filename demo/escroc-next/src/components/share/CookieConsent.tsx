"use client";

import { startTransition, useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/Button";

const CONSENT_KEY = "escroc_cookie_consent";

export function CookieConsent() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CONSENT_KEY)) startTransition(() => setVisible(true));
    } catch {
      startTransition(() => setVisible(true));
    }
  }, []);

  function decide(choice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 sm:bottom-6">
      {/* Glow */}
      <div aria-hidden className="absolute -inset-1 rounded-3xl bg-linear-to-r from-primary/20 via-primary/10 to-transparent blur-xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-card backdrop-blur-xl">
        {/* Top accent line */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

        <div className="flex items-center gap-4 px-5 py-4">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <Cookie size={20} strokeWidth={1.8} aria-hidden />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading">{t("cookie.title")}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {t("cookie.text")}{" "}
              <a href="#" className="font-medium text-primary underline-offset-2 hover:underline">
                {t("cookie.privacy")}
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => decide("declined")}>
              {t("cookie.decline")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => decide("accepted")}>
              {t("cookie.allow")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
