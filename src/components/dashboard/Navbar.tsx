"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, CircleHelp, LogOut, Menu } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { TOKEN_KEY } from "@/lib/axios";
import { LanguageSwitcher } from "@/components/share/LanguageSwitcher";
import { cn } from "@/components/ui/cn";
import { dsx } from "./ui";

/**
 * Top bar of the overview: page title on the left, then help, bell, language
 * and the account menu. The theme control is NOT here — the reference design
 * keeps it as the sidebar's "Light Mode" row — and logout, which the old bar
 * showed as its own button, now lives in the avatar dropdown.
 */
/**
 * Route -> nav key. Longest match wins, so a future `/dashboard/buy-crypto/xyz`
 * still titles itself "Buy Crypto" rather than falling back to the overview.
 */
const TITLES: { prefix: string; key: string }[] = [
  { prefix: "/dashboard/buy-crypto", key: "dashboard.nav.buyCrypto" },
  { prefix: "/dashboard/sell-crypto", key: "dashboard.nav.sellCrypto" },
  { prefix: "/dashboard/withdraw-crypto", key: "dashboard.nav.withdrawCrypto" },
  { prefix: "/dashboard/exchange-crypto", key: "dashboard.nav.exchangeCrypto" },
  { prefix: "/dashboard/my-cards", key: "dashboard.nav.myCards" },
  { prefix: "/dashboard/transactions", key: "dashboard.nav.transactions" },
  { prefix: "/dashboard", key: "dashboard.title" },
];

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();

  const title = TITLES.find((entry) => pathname?.startsWith(entry.prefix))?.key ?? "dashboard.title";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  function handleLogout() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    toast.success(t("dashboard.logout"));
    router.replace("/login");
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenu}
          className={`${dsx.iconBtn} md:hidden`}
          aria-label={t("dashboard.openMenu")}
        >
          <Menu size={18} />
        </button>

        <h1 className="min-w-0 truncate text-[20px]! leading-none! font-bold! tracking-[-0.01em] sm:text-[22px]!">
          {t(title)}
        </h1>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <button type="button" className={cn(dsx.iconBtn, "hidden sm:inline-flex")} aria-label={t("dashboard.help")}>
            <CircleHelp size={17} />
          </button>

          <button type="button" className={cn(dsx.iconBtn, "relative")} aria-label={t("dashboard.notifications")}>
            <Bell size={17} />
            <span
              aria-hidden
              className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-surface"
            />
          </button>

          <LanguageSwitcher />

          {/* ---- Account menu — logout lives here now. */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={t("dashboard.account")}
              className="flex cursor-pointer items-center gap-1.5 rounded-full p-1 transition hover:bg-black/4 dark:hover:bg-white/6"
            >
              <Image
                src="/assets/download/aveter.webp"
                alt=""
                width={700}
                height={966}
                className="h-8.5 w-8.5 rounded-full object-cover ring-1 ring-border"
              />
              <ChevronDown
                size={14}
                className={cn("text-muted transition-transform", menuOpen && "rotate-180")}
              />
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-card">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-heading transition hover:bg-black/4 dark:hover:bg-white/6"
                >
                  <LogOut size={15} />
                  {t("dashboard.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
