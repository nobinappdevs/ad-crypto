"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { GATE_POLL_MS, useDashboard } from "@/hooks/useDashboard";
import { emailVerifiedFromFlags, readToken, twoFaFromFlags } from "@/lib/authState";

const VERIFY_EMAIL_ROUTE = "/verify-email";
const VERIFY_2FA_ROUTE = "/verify-2fa";

/**
 * Gate on the signed-out screens. "Signed in, go away" is too blunt here, because
 * both verification screens live in this route group and are only reachable *with*
 * a token — login and register hand one out before the account is cleared to use
 * it. So the guard sorts four states rather than two:
 *
 *   no token             -> the login/register/forgot screens; the verify screens
 *                           have nothing to verify against, so they go to /login.
 *   token, email pending -> `/verify-email` and nowhere else in this group.
 *   token, 2FA pending   -> `/verify-2fa` and nowhere else in this group.
 *   token, all clear     -> the dashboard; there is nothing here for them.
 *
 * Which of those it is comes from the API, not from localStorage — the same
 * reasoning as `AuthGuard`, and the half that matters more here: a session parked
 * on a code screen has nothing else that would ever notice the flag being cleared
 * in the admin panel, so without asking, the only way out was a code nobody was
 * waiting for any more.
 *
 * With no token there is nothing to ask about, so these screens stay free of
 * requests in the case that is by far the most common.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isClient = useIsClient();

  const authed = isClient && Boolean(readToken());

  const { data, refetch } = useDashboard(authed, {
    refetchOnMount: "always",
    refetchInterval: GATE_POLL_MS,
  });

  // Moving between these screens re-asks, for the same reason the dashboard does.
  useEffect(() => {
    if (authed) refetch();
  }, [pathname, authed, refetch]);

  const emailVerified = emailVerifiedFromFlags(data);
  const twoFa = twoFaFromFlags(data);

  const destination = (() => {
    if (!isClient) return null;

    if (!authed) {
      // A verify screen without a session is a dead end, not a public page.
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) || pathname.startsWith(VERIFY_2FA_ROUTE)
        ? "/login"
        : null;
    }
    // Until the answer lands, the screen the user is on is the safest place to be.
    // Sending them anywhere on a guess is what made this flicker between screens.
    if (!data) return null;

    if (emailVerified === false) {
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) ? null : VERIFY_EMAIL_ROUTE;
    }
    if (twoFa === "pending") {
      return pathname.startsWith(VERIFY_2FA_ROUTE) ? null : VERIFY_2FA_ROUTE;
    }
    return "/dashboard";
  })();

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (destination) return null;
  return <>{children}</>;
}
