import { Suspense } from "react";
import { JournalDetails } from "@/components/homepage/JournalDetails";

export const metadata = {
  title: "Web Journal — AdCrypto",
  description: "Read the full article from the AdCrypto team.",
};

/**
 * One static page reading `?id=`, not an `[id]` segment: a static export would have
 * to enumerate every post at build time, which the API's list rules out.
 * `useSearchParams` opts out of prerendering, hence the Suspense boundary.
 */
export default function JournalDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <JournalDetails />
    </Suspense>
  );
}
