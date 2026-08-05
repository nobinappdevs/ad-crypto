"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useProfile } from "@/hooks/useAuth";

/**
 * Shares the active buyer/seller "view" across the dashboard so the Navbar
 * toggle instantly updates role-driven UI (e.g. the overview's Origin /
 * Counterparties) without waiting for the API round-trip.
 *
 * Effective role = local override (set by the toggle) ?? the account's real
 * type from the profile ?? "buyer".
 */
type RoleCtx = { role: string; setRole: (r: string) => void };

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data } = useProfile();
  const apiType = (data as { data?: { user?: { type?: string } } } | undefined)?.data?.user?.type;
  const [override, setOverride] = useState<string | null>(null);
  const role = override ?? apiType ?? "buyer";
  return <Ctx.Provider value={{ role, setRole: setOverride }}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  return useContext(Ctx) ?? { role: "buyer", setRole: () => {} };
}
