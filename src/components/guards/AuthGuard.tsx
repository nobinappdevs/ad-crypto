"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { GATE_POLL_MS, useDashboard } from "@/hooks/useDashboard";
import { emailVerifiedFromFlags, readToken, twoFaFromFlags } from "@/lib/authState";

/**
 * What shows while the gate is undecided — the client's first tick, the request
 * that decides, and the moment before a redirect leaves.
 *
 * Deliberately empty rather than a spinner: the page's own skeleton takes over the
 * instant this passes, and a second loading language in front of it read as a
 * flash rather than as progress.
 */
function Holding() {
  return <div className="min-h-screen bg-surface" />;
}

/**
 * Gate on the dashboard, decided by the API on every entry.
 *
 * Nothing here is read from localStorage. A stored copy of "this account is
 * verified" is only ever as true as the moment it was written, and an operator
 * flipping `email_verified` or `two_factor_verified` in the admin panel does not
 * write to anybody's browser — which is why the stored version needed a hard
 * reload, and often several attempts, to catch up. So the flags come from
 * `GET /user/dashboard`, the one endpoint that carries them, and they are asked
 * for again on every navigation into the dashboard and every `GATE_POLL_MS` while
 * the user sits there.
 *
 * The order is fixed: no token at all, then the email address, then the
 * authenticator. And the default is HOLD — the dashboard renders only once a
 * response has actually said the account is clear, never on an assumption.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();

  const authed = isClient && Boolean(readToken());

  const { data, isPending, isError, refetch } = useDashboard(authed, {
    // Fresh on arrival, then on a timer: the two ways an operator's change can
    // reach a tab nobody is reloading.
    refetchOnMount: "always",
    refetchInterval: GATE_POLL_MS,
  });

  /**
   * Every move inside the dashboard re-asks. The guard lives in the layout, which
   * does NOT remount between pages, so without this the check would only run on a
   * full page load. React Query folds this into the request already in flight when
   * there is one, so arriving at the overview costs one call, not two.
   */
  useEffect(() => {
    if (authed) refetch();
  }, [pathname, authed, refetch]);

  const emailVerified = emailVerifiedFromFlags(data);
  const twoFa = twoFaFromFlags(data);

  /**
   * A payload that carries no flags gates nothing — that is an endpoint not
   * answering the question, not an account failing it. Same for a request that
   * errored: the API is the real gate on every call behind this screen, and
   * locking the app over a dropped connection would be our outage, not theirs.
   * Anything the session is genuinely missing is refused where it matters.
   */
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

  // Same markup on the server and the first client paint, so hydration matches.
  if (!isClient || !authed || destination) return <Holding />;
  // Waiting on the answer, with nothing decided yet.
  if (isPending && !isError) return <Holding />;
  return <>{children}</>;
}
