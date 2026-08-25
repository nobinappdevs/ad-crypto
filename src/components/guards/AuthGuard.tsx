"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthMirror } from "@/hooks/useAuthMirror";
import { useDashboard } from "@/hooks/useDashboard";
import { Sk, SkPageHeader } from "@/components/dashboard/Skeletons";
import { accountGateState } from "@/lib/authState";

/**
 * The shell's shape, for the first client tick and for a pending redirect.
 * Local on purpose — pages have their own skeletons; this one is not their
 * fallback.
 */
function Holding() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-h-screen bg-surface md:grid md:grid-cols-[56px_1fr] lg:grid-cols-[260px_1fr]"
    >
      {/* Sidebar rail. */}
      <aside className="hidden border-e border-border bg-card p-3 md:block">
        <Sk className="h-9 w-9 rounded-xl" />
        <div className="mt-6 flex flex-col gap-2.5">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Sk className="h-8 w-8 shrink-0 rounded-lg" soft={i > 0} />
              <Sk className="hidden h-3 w-28 lg:block" soft />
            </div>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-col">
        {/* The top bar. */}
        <div className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
          <Sk className="h-3.5 w-40" soft />
          <div className="flex items-center gap-2.5">
            <Sk className="h-9 w-9 rounded-lg" soft />
            <Sk className="h-9 w-9 rounded-full" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
          <SkPageHeader />
          <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
            <Sk className="h-72 w-full rounded-2xl lg:col-span-7" soft />
            <Sk className="h-72 w-full rounded-2xl lg:col-span-5" soft />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Gate on the dashboard: no token, then the email address, then the authenticator.
 *
 * Decided by `accountGateState` — the same answer `GuestGuard` uses, so the two
 * can't disagree. One `GET /user/dashboard` on mount; nothing polls.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  const mirror = useAuthMirror();
  const { isClient, authed } = mirror;

  const { data } = useDashboard(authed, { refetchOnMount: "always" });

  const { emailVerified, twoFa } = accountGateState(data, mirror);

  /** Nothing answered (no mirror, no flags, a failed request) gates nothing. */
  const destination = !isClient
    ? null
    : !authed
      ? "/login"
      : emailVerified === false
        ? "/verify-email"
        : twoFa === "pending"
          ? "/verify-2fa"
          : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  // Held for no session and for a pending redirect — but NOT while the gate
  // request is in flight, so the page keeps its own skeleton.
  if (!isClient || !authed || destination) return <Holding />;
  return <>{children}</>;
}
