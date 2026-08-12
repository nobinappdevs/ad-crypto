"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY } from "@/lib/axios";
import { readEmailVerified, startEmailOtpFlow, readTwoFaState } from "@/lib/authState";
import { useIsClient } from "@/hooks/useIsClient";

function Spinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <Loader2 size={28} strokeWidth={2} className="animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

/** Guest-only pages (login/register/forgot): logged-in users go to /dashboard. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(window.localStorage.getItem(TOKEN_KEY)) : false;

  useEffect(() => {
    if (!isClient || !authed) return;
    // Don't shove a half-registered user into the dashboard — they hold a token
    // but still owe us the email OTP. AuthGuard makes the authoritative call.
    if (readEmailVerified() === false) {
      startEmailOtpFlow();
      router.replace("/verify-otp");
      return;
    }
    // Same idea one step later: a session still owing its authenticator code
    // belongs on /verify-2fa, not on a dashboard that would bounce it back.
    if (readTwoFaState() === "pending") {
      router.replace("/verify-2fa");
      return;
    }
    router.replace("/dashboard");
  }, [isClient, authed, router]);

  // Server + first client paint render the same spinner (no hydration mismatch);
  // once mounted, show the page only for guests.
  if (!isClient || authed) return <Spinner />;
  return <>{children}</>;
}
