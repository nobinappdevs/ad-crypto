import type { ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "@/components/ui/cn";

export const dsx = {
  card: "overflow-hidden rounded-2xl border border-border bg-card",
  iconBtn:
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-heading transition hover:bg-black/4 dark:hover:bg-white/6",
};

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(dsx.card, className)}>{children}</div>;
}

/** A panel's header row: its name, an optional qualifier, and its controls. */
export function PanelTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
      <h2 className="text-[16px]! font-bold!">
        {children}
        {hint ? <span className="ml-1.5 text-[13px]! font-normal! text-muted">{hint}</span> : null}
      </h2>
      <div className="flex items-center gap-2">{action}</div>
    </div>
  );
}

/** Decorative "..." menu — every card and panel in the design carries one. */
export function EllipsisButton() {
  return (
    <button
      type="button"
      className={cn(dsx.iconBtn, "h-8 w-8 cursor-pointer text-muted")}
      aria-hidden
      tabIndex={-1}
    >
      <Ellipsis size={16} />
    </button>
  );
}
