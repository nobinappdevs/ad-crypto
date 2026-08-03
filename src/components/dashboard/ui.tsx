import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

export const dsx = {
  card: "overflow-hidden rounded-2xl border border-border bg-card",
  iconBtn:
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-heading transition hover:bg-black/4 dark:hover:bg-white/6",
};

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(dsx.card, className)}>{children}</div>;
}
