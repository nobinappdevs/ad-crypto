import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export const dsx = {
  page: "mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-10",
  card: "overflow-hidden rounded-2xl border border-border bg-card",
  header:
    "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-4 sm:px-6 sm:py-5",
  title: "text-base font-bold text-heading",
  iconBtn:
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-heading transition hover:bg-black/4 dark:hover:bg-white/6",
};

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(dsx.card, className)}>{children}</div>;
}

export function PanelHeader({ children }: { children: ReactNode }) {
  return <div className={dsx.header}>{children}</div>;
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className={cn(dsx.card, "p-5")}>
      <div className="flex items-center justify-between">
        <span className="inline! text-muted">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[22px]! font-bold text-heading">{value}</p>
    </div>
  );
}
