import { DashboardHomeSkeleton } from "@/components/dashboard/Skeletons";

/**
 * The overview's own skeleton, and ONLY the overview's — hence the `(overview)`
 * route group, which adds nothing to the URL. One level up it wrapped every sibling
 * route too, so each page painted this shape before its own.
 */
export default function Loading() {
  return <DashboardHomeSkeleton />;
}
