"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { TOKEN_KEY } from "@/lib/axios";

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const authed = isClient ? Boolean(localStorage.getItem(TOKEN_KEY)) : false;

  useEffect(() => {
    if (isClient && authed) router.replace("/dashboard");
  }, [isClient, authed, router]);

  if (isClient && authed) return null;
  return <>{children}</>;
}
