"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Returns `false` on the server and during the first (hydration) render, then
 * `true` after mount — without triggering a hydration mismatch. Use it to gate
 * any client-only branch (e.g. reading localStorage) so SSR and the first
 * client paint render identically.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
