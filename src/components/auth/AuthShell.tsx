"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { ThemeToggle } from "@/components/share/ThemeToggle";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useLang();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="inline-flex! items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet size={16} />
          </span>
          <span className="inline! text-[16px] font-bold text-heading">{t("brand.name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
          {children}
        </div>
      </main>
    </div>
  );
}
