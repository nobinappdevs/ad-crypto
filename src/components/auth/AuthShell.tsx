import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/share/Logo";
import { ThemeToggle } from "@/components/share/ThemeToggle";
import { PromoPanel } from "@/components/promo/PromoPanel";

// The platform's own numbers (as in the Overview section), not the sign-up bonus.
const STATS = ["gateways", "currencies", "transactions"] as const;

/**
 * The fixed half of the auth design: a full-bleed frame — no floating card — with
 * a slim header above the promo/form split. Only `children` changes between
 * `/login` and `/register`.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--panel-bg)" }}>
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" aria-label="AdCrypto">
          <Logo />
        </Link>
        <ThemeToggle variant="panel" />
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.06fr)]">
        {/* The form is FIRST in the DOM, second only from `lg`. Source order, not a
            CSS swap: a phone visitor lands on the field they came for, and the
            promo holds no tab stops for the visual order to disagree with. */}
        <div className="flex flex-col justify-center px-5 pt-2 pb-10 sm:px-10 sm:pb-14 lg:order-2 lg:px-20 lg:py-12">
          <div className="mx-auto w-full max-w-125">{children}</div>
        </div>

        {/* Below `lg` it drops the animated scene and keeps the promise and the
            three numbers — the scene was what stood between a phone and the form. */}
        <PromoPanel
          baseKey="authPanel"
          headingBaseKey="overview"
          headingVariant="descriptive"
          stats={STATS}
          statsBaseKey="overview.stats"
          statsVariant="descriptive"
          className="lg:order-1"
          sceneClass="hidden lg:flex"
        />
      </div>
    </div>
  );
}
