"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { readEmailVerified, readToken, readTwoFaState } from "@/lib/authState";

/**
 * What shows while the gate is undecided — one client tick on a reload, or the
 * moment before a redirect leaves.
 *
 * Deliberately empty. A spinner here fired on every single reload of every
 * dashboard page, and it was never waiting on anything the user could perceive:
 * the token check is a synchronous localStorage read. The page's own skeleton
 * takes over the instant this passes, so a spinner only added a flash of a
 * different loading language in front of it.
 */
function Holding() {
  return <div className="min-h-screen bg-surface" />;
}

/**
 * Gate on the dashboard. Three separate refusals, because there are three ways to
 * arrive with a token that isn't yet good enough: no token at all, an unconfirmed
 * email address, and an authenticator code this session hasn't answered. Login
 * issues a working token before either check — see `@/lib/authState`.
 *
 * A `null` from either reader means this browser has no record either way; that
 * passes, since the API rejects the requests that actually matter.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();

  const authed = isClient && Boolean(readToken());
  const destination = !isClient
    ? null
    : !authed
      ? "/login"
      : readEmailVerified() === false
        ? "/verify-email"
        : readTwoFaState() === "pending"
          ? "/verify-2fa"
          : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  // Same markup on the server and the first client paint, so hydration matches.
  if (!isClient || destination) return <Holding />;
  return <>{children}</>;
}
