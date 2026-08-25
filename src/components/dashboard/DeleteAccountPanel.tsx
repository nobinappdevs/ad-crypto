"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useDeleteAccount } from "@/hooks/useAuth";

/**
 * Closing the account, from the security page and the profile.
 *
 * The one irreversible action in the app, so it gets two locks: a dialog, and a
 * checkbox inside it that has to be ticked before the button enables.
 */
export function DeleteAccountPanel() {
  const { t } = useLang();
  const k = (name: string) => t(`deleteAccount.${name}`);

  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const deleteAccount = useDeleteAccount(k("successToast"));

  function close() {
    setOpen(false);
    setAcknowledged(false);
  }

  return (
    <>
      {/* `dsx.card`'s shape, but not `Panel` itself: the red border has to replace
          `border-border` rather than sit next to it, and `cn` doesn't dedupe. */}
      <div className="overflow-hidden rounded-2xl border border-hero-neg/25 bg-card p-4 sm:p-6">
        <h2 className="text-[14px]! font-bold! text-hero-neg">{k("title")}</h2>
        <p className="mt-1.5 text-[12.5px]! leading-relaxed! text-muted">{k("desc")}</p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-hero-neg/40 px-4 text-[13px] font-bold text-hero-neg transition hover:bg-hero-neg/8"
        >
          <Trash2 size={14} aria-hidden />
          {k("cta")}
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={close}
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
                <Trash2 size={20} />
              </span>

              <h2 className="mt-4 text-[17px]! font-bold!">{k("confirmTitle")}</h2>
              <p className="mt-1.5 text-[13px]! leading-relaxed! text-muted">{k("confirmDesc")}</p>

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-start">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[rgb(var(--hero-neg))]"
                />
                <span className="text-[12.5px]! leading-relaxed! text-heading">{k("ack")}</span>
              </label>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-heading transition hover:bg-black/4 dark:hover:bg-white/5"
                >
                  {t("dashboard.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => deleteAccount.mutate()}
                  disabled={!acknowledged || deleteAccount.isPending}
                  className="flex-1 cursor-pointer rounded-xl bg-hero-neg px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteAccount.isPending ? k("deleting") : k("confirmCta")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
