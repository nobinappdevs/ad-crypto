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
 * What this browser has been told about the session — token, email flag, 2FA
 * state, and the operator's verification switch — as a value that re-renders when
 * it changes.
 *
 * `useSyncExternalStore` rather than reading localStorage in the render body,
 * because a plain read is wrong twice over: storage is not reactive, so a value
 * written by a mutation callback never reaches a mounted guard, and with the React
 * Compiler on, the read is memoized and does not happen again at all. Both show up
 * the same way — a guard still holding the answer from before the user signed in.
 *
 * The server snapshot is empty, which is how `isClient` stays false through the
 * first paint and hydration matches.
 */
export function useAuthMirror(): AuthMirror {
  const snapshot = useSyncExternalStore(
    subscribeAuthState,
    authStateSnapshot,
    authStateServerSnapshot,
  );
  return parseAuthMirror(snapshot);
}
