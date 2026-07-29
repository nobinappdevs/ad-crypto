"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { TOKEN_KEY } from "@/lib/axios";

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

  useEffect(() => {
    if (isClient && !authed) router.replace("/login");
  }, [isClient, authed, router]);

  if (!isClient || !authed) return <Spinner />; // same markup on server + first paint
  return <>{children}</>;
}
