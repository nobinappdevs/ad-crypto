"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * Breadcrumb + title block for every dashboard sub-page — the navbar above carries
 * only the section name, so the trail back lives here.
 */
export function DashPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { t } = useLang();

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link
            href="/dashboard"
            className="text-muted transition-colors hover:text-primary"
          >
            {t("dashboard.nav.dashboard")}
          </Link>
          <ChevronRight size={13} aria-hidden className="text-muted rtl:rotate-180" />
          <span className="font-medium text-heading">{title}</span>
        </nav>

        <h1 className="mt-2 text-[24px]! leading-none! font-bold! tracking-[-0.02em] sm:text-[28px]!">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-140 text-[13.5px]! text-muted">{subtitle}</p>}
      </div>

      {action}
    </div>
  );
}
