export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",

  /**
   * There is no backend yet, and `apiUrl` points at a placeholder host that does
   * not resolve. Two things follow from that, so both hang off this one flag:
   *
   *   1. Auth mutations resolve locally (see `demoOr` in useAuth) instead of
   *      failing with a network error.
   *   2. `AuthGuard` and `GuestGuard` enforce nothing, so every route opens —
   *      `/dashboard` without signing in, `/login` even while a token is stored.
   *
   * Without (2) the dashboard is unreachable no matter what: no API means no
   * token, and no token means AuthGuard redirects straight back to /login.
   *
   * Deliberately an explicit opt-in rather than "give up when the request
   * fails": a real API that is briefly down must never be mistaken for a
   * successful sign-in, and a failed request must never disable the guards. Set
   * it false the day a backend lands and both behaviours revert together.
   */
  noBackend: process.env.NEXT_PUBLIC_NO_BACKEND === "true",
};
