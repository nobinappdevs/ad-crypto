"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "./Container";

const LAUNCH_YEAR = 2026;

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <Link href="/" className="inline-flex! items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet size={14} />
          </span>
          <span className="inline! text-[15px] font-bold text-heading">{t("brand.name")}</span>
        </Link>
        <span className="inline! text-muted">
          &copy; {LAUNCH_YEAR} {t("brand.name")}. {t("footer.rights")}
        </span>
      </Container>
    </footer>
  );
}
