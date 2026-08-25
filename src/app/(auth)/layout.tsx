import type { ReactNode } from "react";
import { GuestGuard } from "@/components/guards/GuestGuard";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Shared by `/login` and `/register`: the guard and the panel shell. Next swaps only
 * `children`, so the shell never unmounts between the two.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <AuthShell>{children}</AuthShell>
    </GuestGuard>
  );
}
