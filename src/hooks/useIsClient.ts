import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false on server + first render, true after mount, with no hydration mismatch. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
