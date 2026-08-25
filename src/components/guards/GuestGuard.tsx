"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthMirror } from "@/hooks/useAuthMirror";
import { useDashboard } from "@/hooks/useDashboard";
import { accountGateState } from "@/lib/authState";

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
 * Which of those it is comes from `accountGateState` — the same answer `AuthGuard`
 * uses, so the two can't disagree and volley a user between them. That answer is
 * available on the FIRST render, from what register/login just wrote down, which
 * is what this screen needs: a freshly registered account arrives here a
 * millisecond after the response that created it, long before `GET /user/dashboard`
 * has said anything. Waiting for that request instead is what let an unverified
 * account slide into the dashboard on a payload that simply hadn't answered yet.
 *
 * The live call still runs and still wins once it lands, which is what notices a
 * flag cleared in the admin panel while somebody sits on a code screen.
 *
 * With no token there is nothing to ask about, so these screens stay free of
 * requests in the case that is by far the most common. With one, it is a single
 * call on mount — nothing polls here either.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const mirror = useAuthMirror();
  const { isClient, authed } = mirror;

  const { data } = useDashboard(authed, { refetchOnMount: "always" });

  const { emailVerified, twoFa } = accountGateState(data, mirror);

  const destination = (() => {
    if (!isClient) return null;

    if (!authed) {
      // A verify screen without a session is a dead end, not a public page.
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) || pathname.startsWith(VERIFY_2FA_ROUTE)
        ? "/login"
        : null;
    }

    // The email address first, and it is the whole answer while it is unresolved:
    // an account that still owes a code belongs on that screen and nowhere else,
    // and one that owes nothing has no business on it.
    if (emailVerified === false) {
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) ? null : VERIFY_EMAIL_ROUTE;
    }
    // Only once the email question is settled — otherwise an unverified account
    // gets asked for an authenticator code ahead of the code it actually owes.
    if (emailVerified === true) {
      if (twoFa === "pending") {
        return pathname.startsWith(VERIFY_2FA_ROUTE) ? null : VERIFY_2FA_ROUTE;
      }
      // Cleared on both counts: there is nothing on these screens for them.
      if (twoFa !== null) return "/dashboard";
    }

    // Nobody has answered yet. The screen the user is on is the safest place to
    // be — sending them anywhere on a guess is what made this flicker.
    return null;
  })();

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (destination) return null;
  return <>{children}</>;
}
