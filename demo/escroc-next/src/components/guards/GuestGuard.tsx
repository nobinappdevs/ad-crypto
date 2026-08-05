"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY } from "@/lib/axios";
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
    if (isClient && authed) router.replace("/dashboard");
  }, [isClient, authed, router]);

  // Server + first client paint render the same spinner (no hydration mismatch);
  // once mounted, show the page only for guests.
  if (!isClient || authed) return <Spinner />;
  return <>{children}</>;
}
