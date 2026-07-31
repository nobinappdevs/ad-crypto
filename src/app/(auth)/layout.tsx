import type { ReactNode } from "react";
import { GuestGuard } from "@/components/guards/GuestGuard";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Shared by both `/login` and `/register`: the guard and the fixed panel shell.
 * Next only swaps `children` between the two routes, so the shell — promo panel,
 * theme toggle, panel frame — never unmounts on navigation between them.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <AuthShell>{children}</AuthShell>
    </GuestGuard>
  );
}
