"use client";

import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

/**
 * "Log out of AdCrypto?" — the one confirmation between a click and a signed-out
 * session.
 *
 * Portalled to `<body>`: raised from inside the sticky header or the rail it would
 * be trapped in that stacking context and land under them.
 *
 * Shared by the navbar's account menu and the sidebar's own row, so the two cannot
 * drift into asking differently — or one of them not asking at all.
 */
export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);
  const logout = useLogout(k("loggedOut"));

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-card"
      >
        <span
          aria-hidden
          className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
        >
          <LogOut size={20} />
        </span>
        <h2 className="mt-4 text-[17px]! font-bold!">{k("logoutTitle")}</h2>
        <p className="mt-1.5 text-[13px]! leading-relaxed! text-muted">{k("logoutDesc")}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-heading transition hover:bg-black/4 dark:hover:bg-white/5"
          >
            {k("cancel")}
          </button>
          <Button
            variant="danger"
            size="md"
            fullWidth
            loading={logout.isPending}
            onClick={() => logout.mutate()}
            className="flex-1"
          >
            {k("confirmLogout")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
