"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { TOKEN_KEY } from "@/lib/axios";
import { env } from "@/config/env";

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;

  // Stood down alongside AuthGuard while there is no backend — otherwise a demo
  // token left in localStorage makes /login, /register and /forgot-password
  // redirect away, which is exactly the opposite of "every route opens".
  // See env.noBackend.
  useEffect(() => {
    if (env.noBackend) return;
    if (isClient && authed) router.replace("/dashboard");
  }, [isClient, authed, router]);

  if (env.noBackend) return <>{children}</>;

  if (isClient && authed) return null;
  return <>{children}</>;
}
