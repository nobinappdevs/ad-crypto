"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY } from "@/lib/axios";
import {
  readEmailVerified,
  setEmailVerified,
  startEmailOtpFlow,
  emailVerifiedFromResponse,
  readTwoFaState,
  setTwoFaState,
  twoFaStateFromResponse,
} from "@/lib/authState";
import { useIsClient } from "@/hooks/useIsClient";
import { useProfile } from "@/hooks/useAuth";

function Spinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <Loader2 size={28} strokeWidth={2} className="animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

/**
 * Protects authenticated areas: no token → /login, unverified email →
 * /verify-otp, unanswered Google-2FA code → /verify-2fa.
 *
 * A token isn't proof of access here — signup and an unverified login both hand
 * one out so the OTP call can authenticate. So we check the stored
 * `email_verified` flag first (instant, no request) and confirm it against
 * `/user/profile`, which is the copy the user can't edit. The profile query
 * shares its cache key with the dashboard's own `useProfile` calls, so this
 * costs no extra request.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(window.localStorage.getItem(TOKEN_KEY)) : false;

  const stored = isClient ? readEmailVerified() : null;
  // Already known-unverified → we're redirecting anyway, don't spend a request.
  const { data: profileRes, isError: profileFailed } = useProfile(authed && stored !== false);
  const fromServer = profileRes ? emailVerifiedFromResponse(profileRes) : null;

  // The server wins when it has answered; otherwise the local flag stands in.
  // Both null means "unknown" — a pre-existing session or a profile response
  // without the field — and we hold the spinner rather than guess. If the
  // profile call itself failed we can't verify anything, so treat it as denied.
  const verified = fromServer ?? stored ?? (profileFailed ? false : null);

  // Same shape for the authenticator step: the profile's copy of
  // `two_factor_status` / `two_factor_verified` is authoritative, the stored
  // value covers the gap before it answers. Only "pending" blocks — an account
  // without 2FA switched on ("off") walks straight through, and an unknown
  // state waits for the profile rather than locking anyone out of their own
  // dashboard.
  const twoFaFromServer = profileRes ? twoFaStateFromResponse(profileRes) : null;
  const twoFa = twoFaFromServer ?? (isClient ? readTwoFaState() : null);

  useEffect(() => {
    if (!isClient) return;
    if (!authed) {
      router.replace("/login");
      return;
    }
    if (verified === false) {
      startEmailOtpFlow();
      router.replace("/verify-otp");
      return;
    }
    if (verified === true && twoFa === "pending") router.replace("/verify-2fa");
  }, [isClient, authed, verified, twoFa, router]);

  // Keep the local flags honest — a hand-edited "1" gets overwritten the moment
  // the profile disagrees, and a legacy session gets its flags backfilled.
  useEffect(() => {
    if (fromServer !== null) setEmailVerified(fromServer);
  }, [fromServer]);

  useEffect(() => {
    if (twoFaFromServer) setTwoFaState(twoFaFromServer);
  }, [twoFaFromServer]);

  // Server + first client paint render the same spinner (no hydration mismatch);
  // once mounted, show the app only to a verified, authenticated user who owes
  // no authenticator code.
  if (!isClient || !authed || verified !== true || twoFa === "pending") return <Spinner />;
  return <>{children}</>;
}
