import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

/** Centered shield badge + title + subtitle, shared by login & register. */
export function AuthHeader({ title, subtitle }: { title?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <ShieldCheck size={22} strokeWidth={2} aria-hidden />
      </div>
      <h3 className="mt-4">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
    </div>
  );
}
