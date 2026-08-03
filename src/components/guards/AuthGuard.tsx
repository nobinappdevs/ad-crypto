"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { TOKEN_KEY } from "@/lib/axios";
import { env } from "@/config/env";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;

  // While there is no backend this guard cannot do its job: no API means no
  // token can ever be issued, so enforcing it would bounce every visitor out of
  // the dashboard forever. It stands down until one exists — see env.noBackend.
  // The real behaviour below is left intact, not deleted.
  useEffect(() => {
    if (env.noBackend) return;
    if (isClient && !authed) router.replace("/login");
  }, [isClient, authed, router]);

  // A build-time constant, so server and first client render agree — the
  // dashboard paints immediately with no spinner flash.
  if (env.noBackend) return <>{children}</>;

  if (!isClient || !authed) return <Spinner />; // same markup on server + first paint
  return <>{children}</>;
}
