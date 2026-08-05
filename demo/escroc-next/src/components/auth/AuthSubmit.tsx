"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * The auth pages' primary CTA — the same gradient pill the homepage hero form
 * uses, so both entry points feel identical.
 */
export function AuthSubmit({
  loading = false,
  disabled = false,
  loadingLabel,
  children,
}: {
  loading?: boolean;
  disabled?: boolean;
  /** Shown beside the spinner while the request is in flight. */
  loadingLabel?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-primary to-primary/90 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-primary/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
    >
      {loading && <Loader2 size={17} strokeWidth={2.5} className="animate-spin" aria-hidden />}
      {loading ? loadingLabel ?? children : children}
    </button>
  );
}
