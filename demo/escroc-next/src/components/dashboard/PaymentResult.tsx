"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CircleCheck, CircleX } from "lucide-react";
import { Panel, dsx } from "@/components/dashboard/ui";
import { useLang } from "@/hooks/useLang";

export type ResultAction = { href: string; labelKey: string; icon: ReactNode };

/**
 * Presentational success/cancel result card shared by the add-money and escrow
 * gateway-return pages. Pure — no data side effects; each caller owns its own
 * cache invalidation.
 */
export function PaymentResultView({
  variant,
  titleKey,
  descKey,
  primary,
  secondary,
}: {
  variant: "success" | "cancel";
  titleKey: string;
  descKey: string;
  primary: ResultAction;
  secondary?: ResultAction;
}) {
  const { t } = useLang();
  const isSuccess = variant === "success";
  const Icon = isSuccess ? CircleCheck : CircleX;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center justify-center">
      <Panel className="w-full">
        <div className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
          <span
            className={`grid h-16 w-16 place-items-center rounded-full ${
              isSuccess ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-500"
            }`}
          >
            <Icon size={34} strokeWidth={2} aria-hidden />
          </span>

          <h1 className="mt-5 text-xl font-black tracking-tight text-heading">{t(titleKey)}</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{t(descKey)}</p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={primary.href} className={dsx.btnPrimary}>
              {primary.icon}
              <span className="text-white">{t(primary.labelKey)}</span>
            </Link>
            {secondary && (
              <Link href={secondary.href} className={dsx.btnGhost}>
                {secondary.icon}
                {t(secondary.labelKey)}
              </Link>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
