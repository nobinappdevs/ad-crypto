"use client";

import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

/**
 * Shared logout confirmation — used by the dashboard navbar and the sidebar so
 * both entry points behave identically.
 *
 * Portalled to <body> so it escapes the sticky header's stacking context and
 * overlays the sidebar too. Owns the mutation: the caller only toggles `open`.
 */
export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const logout = useLogout();

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => { if (!logout.isPending) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
          <LogOut size={22} strokeWidth={2} aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-bold text-heading">{t("dashboard.navbar.logoutTitle")}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("dashboard.navbar.logoutDesc")}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={logout.isPending}
            className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
          >
            {t("dashboard.navbar.cancel")}
          </button>
          <Button
            variant="danger"
            size="md"
            fullWidth
            loading={logout.isPending}
            onClick={() => logout.mutate()}
            className="flex-1"
          >
            {t("dashboard.navbar.confirmLogout")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
