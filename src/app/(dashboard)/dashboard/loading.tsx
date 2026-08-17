import { DashboardHomeSkeleton } from "@/components/dashboard/Skeletons";

/**
 * Shown while a dashboard route's chunk loads. Every page under here has one, so a
 * click on the sidebar paints the page's shape immediately instead of leaving the
 * previous view frozen until the next one is ready.
 */
export default function Loading() {
  return <DashboardHomeSkeleton />;
}
