"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";

/**
 * Replaces the old Log In / Register tab switcher at the top of the form.
 * Switching between the two forms already happens via the prompt link at the
 * bottom of each one ("Already have an account? Log In Now"), so the top of
 * the form only needs a way back out — to the marketing site by default, or
 * wherever `href`/`labelKey` point it (the forgot-password flow sends it back
 * to `/login` instead, since that's where that flow actually started).
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
