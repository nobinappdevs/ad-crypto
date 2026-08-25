import { DashboardHomeSkeleton } from "@/components/dashboard/Skeletons";

/**
 * The overview's own skeleton, and ONLY the overview's.
 *
 * It lives in a route group — `(overview)`, which adds nothing to the URL — so
 * that this boundary wraps `/dashboard` alone. Sitting one level up, at the
 * `dashboard/` segment, it also wrapped every sibling route, so a click on
 * "Buy Crypto" painted the overview's wallets-and-chart shape first and the buy
 * page's own skeleton second. Each page under here has its own; this one is not
 * their fallback.
 */
export default function Loading() {
  return <DashboardHomeSkeleton />;
}
