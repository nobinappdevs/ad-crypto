import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/share/Logo";
import { ThemeToggle } from "@/components/share/ThemeToggle";
import { PromoPanel } from "@/components/promo/PromoPanel";

// The platform's own numbers (same three the Overview section leads with), not
// the sign-up bonus figures — a promo panel selling the platform reads better
// with what it does than with a value/label pair alone. See PromoPanel's
// `statsVariant` doc for why this needs a separate i18n branch.
const STATS = ["gateways", "currencies", "transactions"] as const;

/**
 * The fixed half of the auth design: a full-bleed page frame — no floating
 * card, no max-width, no shadow — with a slim header (site logo, theme toggle)
 * above the promo/form split. None of it depends on whether the visitor is on
 * `/login` or `/register` — only `children`, the form column on the right,
 * changes between the two routes.
 *
 * The source design floated this as a fixed-width card with a drop shadow. That
 * reads fine as a design-tool artboard, but as an actual page it left the panel
 * looking small and adrift on wide viewports — so here it IS the page: the panel
 * takes the full width and height, and the logo/toggle sit in their own row
 * instead of overlapping the panel's corners.
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
        <PromoPanel
          baseKey="authPanel"
          headingBaseKey="overview"
          headingVariant="descriptive"
          stats={STATS}
          statsBaseKey="overview.stats"
          statsVariant="descriptive"
          floorClass=""
        />

        {/* The column stretches full-bleed with the page; the form itself is
            capped at a normal reading measure so inputs don't stretch edge to
            edge on a wide monitor. */}
        <div className="flex flex-col justify-center px-5 pt-2 pb-10 sm:px-10 sm:pb-14 lg:px-20 lg:py-12">
          <div className="mx-auto w-full max-w-125">{children}</div>
        </div>
      </div>
    </div>
  );
}
