import type { ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/Button";

export const dsx = {
  // Page container
  page: "mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-10",

  // Card / panel
  card: "overflow-hidden rounded-2xl border border-border bg-card",

  // Panel header
  header: "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-4 sm:px-6 sm:py-5",
  title: "text-base font-bold text-heading",

  // Table
  th: "border-b border-border bg-surface px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
  td: "border-b border-border px-6 py-3.5 align-middle",
  rowHover: "transition hover:bg-black/[0.025] dark:hover:bg-white/[0.025]",

  // Buttons
  btnPrimary:
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90",
  btnGhost:
    "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium text-muted transition hover:text-heading",
  iconBtn:
    "grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-heading dark:hover:bg-white/10",

  // Chips
  countChip: "inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-muted dark:bg-white/10",

  // Form
  input:
    "h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary",
};

/* ── Panel ── */
export function Panel({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <section className={`${dsx.card} ${className}`}>{children}</section>;
}

export function PanelHeader({ title, badge, children }: { title?: ReactNode; badge?: ReactNode; children?: ReactNode }) {
  return (
    <div className={dsx.header}>
      <div className="flex min-w-0 items-center gap-2.5">
        <h3 className={`${dsx.title} truncate`}>{title}</h3>
        {badge != null && <span className={`${dsx.countChip} shrink-0`}>{badge}</span>}
      </div>
      {/* Toolbar takes its own full-width line on mobile so filters never overflow. */}
      {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">{children}</div>}
    </div>
  );
}

/* ── Status badge ── */
const TONES = {
  pending: {
    box: "border border-amber-500/20 bg-amber-500/[0.03] text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },

  success: {
    box: "border border-primary/20 bg-primary/[0.03] text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary",
    dot: "bg-primary",
  },

  released: {
    box: "border border-primary/20 bg-primary/[0.03] text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary",
    dot: "bg-primary",
  },

  info: {
    box: "border border-indigo-500/20 bg-indigo-500/[0.03] text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },

  danger: {
    box: "border border-rose-500/20 bg-rose-500/[0.03] text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300",
    dot: "bg-rose-500",
  },

  neutral: {
    box: "border border-border bg-black/[0.03] text-muted dark:border-border dark:bg-white/[0.05] dark:text-muted",
    dot: "bg-muted",
  },
};
export function StatusBadge({ tone = "neutral", children }: { tone?: string; children?: ReactNode }) {
  const t = TONES[tone as keyof typeof TONES] ?? TONES.neutral;
  return (
<span
  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${t.box}`}
>
  <i className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
  {children}
</span>
  );
}

/* ── Pagination footer ── */
export function TableFooter({ shown, total, unit = "" }: { shown?: ReactNode; total?: ReactNode; unit?: string }) {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-6 sm:py-4">
      <span className="text-sm text-muted">
        {t("dashboard.common.showing")} <b className="font-semibold text-heading">1–{shown}</b> {t("dashboard.common.of")} {total}
        {unit ? ` ${unit}` : ""}
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled>{t("dashboard.common.previous")}</Button>
        <Button variant="outline" size="sm" disabled>{t("dashboard.common.next")}</Button>
      </div>
    </div>
  );
}
