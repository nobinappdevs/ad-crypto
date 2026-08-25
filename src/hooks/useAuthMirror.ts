"use client";

import { useSyncExternalStore } from "react";
import {
  authStateServerSnapshot,
  authStateSnapshot,
  parseAuthMirror,
  subscribeAuthState,
  type AuthMirror,
} from "@/lib/authState";

/**
 * What this browser has been told about the session — token, email flag, 2FA state,
 * verification switch — as a value that re-renders when it changes.
 *
 * `useSyncExternalStore`, not a render-body localStorage read: storage is not
 * reactive, and with the React Compiler on the read is memoized and never runs
 * again. Either way a guard keeps answering from before the user signed in.
 *
 * The server snapshot is empty, which keeps `isClient` false until hydration.
 */
export function useAuthMirror(): AuthMirror {
  const snapshot = useSyncExternalStore(
    subscribeAuthState,
    authStateSnapshot,
    authStateServerSnapshot,
  );
  return parseAuthMirror(snapshot);
}
