"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { readEmailVerified, readToken, readTwoFaState } from "@/lib/authState";

const VERIFY_EMAIL_ROUTE = "/verify-email";
const VERIFY_2FA_ROUTE = "/verify-2fa";

/**
 * Gate on the signed-out screens. "Signed in, go away" is too blunt here, because
 * both verification screens live in this route group and are only reachable *with*
 * a token — login and register hand one out before the account is cleared to use
 * it. So the guard sorts four states rather than two, and the two gates run in a
 * fixed order (email, then authenticator):
 *
 *   no token             -> the login/register/forgot screens; the verify screens
 *                           have nothing to verify against, so they go to /login.
 *   token, email pending -> `/verify-email` and nowhere else in this group.
 *   token, 2FA pending   -> `/verify-2fa` and nowhere else in this group.
 *   token, all clear     -> the dashboard; there is nothing here for them.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isClient = useIsClient();

  const destination = (() => {
    if (!isClient) return null;

    if (!readToken()) {
      // A verify screen without a session is a dead end, not a public page.
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) || pathname.startsWith(VERIFY_2FA_ROUTE)
        ? "/login"
        : null;
    }
    if (readEmailVerified() === false) {
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) ? null : VERIFY_EMAIL_ROUTE;
    }
    if (readTwoFaState() === "pending") {
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
