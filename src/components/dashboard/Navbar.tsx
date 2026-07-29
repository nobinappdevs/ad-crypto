"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { TOKEN_KEY } from "@/lib/axios";
import { ThemeToggle } from "@/components/share/ThemeToggle";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";
import { dsx } from "./ui";

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLang();
  const router = useRouter();

  function handleLogout() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    toast.success(t("dashboard.logout"));
    router.replace("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-bg px-4 sm:px-6">
      <button type="button" onClick={onMenu} className={`${dsx.iconBtn} md:hidden`} aria-label="Open menu">
        <Menu size={18} />
      </button>

      <div className="flex flex-1 items-center justify-end gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex! items-center gap-2 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium text-heading transition hover:bg-surface"
        >
          <LogOut size={14} />
          <span className="inline!">{t("dashboard.logout")}</span>
        </button>
      </div>
    </header>
  );
}
