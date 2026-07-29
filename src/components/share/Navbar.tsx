"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useIsClient } from "@/hooks/useIsClient";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/components/ui/cn";
import { TOKEN_KEY } from "@/lib/axios";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { t } = useLang();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;
  const { hidden } = useHideOnScroll();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md transition-transform duration-500 ease-out",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex! items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Wallet size={16} />
          </span>
          <span className="inline! text-[16px] font-bold text-heading">{t("brand.name")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-heading">
            {t("nav.home")}
          </Link>
          <Link href="/about" className="text-heading">
            {t("nav.about")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href={authed ? "/dashboard" : "/login"}>
            <Button size="sm">{authed ? t("nav.dashboard") : t("nav.login")}</Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
