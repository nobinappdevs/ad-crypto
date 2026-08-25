"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthMirror } from "@/hooks/useAuthMirror";
import { useDashboard } from "@/hooks/useDashboard";
import { accountGateState } from "@/lib/authState";

const VERIFY_EMAIL_ROUTE = "/verify-email";
const VERIFY_2FA_ROUTE = "/verify-2fa";

/**
 * Gate on the signed-out screens. Four states, not two — the verify screens live
 * in this group and need a token:
 *
 *   no token             -> login/register/forgot; the verify screens go to /login.
 *   token, email pending -> `/verify-email` and nowhere else here.
 *   token, 2FA pending   -> `/verify-2fa` and nowhere else here.
 *   token, all clear     -> the dashboard.
 *
 * From `accountGateState`, same as `AuthGuard`. It answers on the first render
 * (from what register/login wrote), and the live call overrides it once it lands.
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

    // The email address first, and it is the whole answer while unresolved.
    if (emailVerified === false) {
      return pathname.startsWith(VERIFY_EMAIL_ROUTE) ? null : VERIFY_EMAIL_ROUTE;
    }
    // 2FA only once the email question is settled.
    if (emailVerified === true) {
      if (twoFa === "pending") {
        return pathname.startsWith(VERIFY_2FA_ROUTE) ? null : VERIFY_2FA_ROUTE;
      }
      if (twoFa !== null) return "/dashboard";
    }

    // Nobody has answered yet — staying put beats guessing.
    return null;
  })();

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  if (destination) return null;
  return <>{children}</>;
}
