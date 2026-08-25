"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * The way out of the top of an auth form — switching between login and register
 * already happens via the prompt link at the bottom. Defaults to the marketing
 * site; `href`/`labelKey` point it elsewhere (forgot-password sends it to `/login`).
 */
export function AuthBackHome({
  href = "/",
  labelKey = "authPanel.backToHome",
}: {
  href?: string;
  labelKey?: string;
}) {
  const { t } = useLang();

  return (
    <Link
      href={href}
      className="inline-flex! w-fit items-center gap-2 text-[13.5px]! font-semibold! text-panel-muted transition-colors duration-200 hover:text-primary"
    >
      <ArrowLeft size={16} aria-hidden />
      {t(labelKey)}
    </Link>
  );
}
