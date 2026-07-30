import { Suspense } from "react";
import { JournalDetails } from "@/components/homepage/JournalDetails";

export const metadata = {
  title: "Web Journal — AdCrypto",
  description: "Read the full article from the AdCrypto team.",
};

/**
 * A single static page rather than a `[id]` segment.
 *
 * The app is a static export (`output: "export"`), so a dynamic segment would
 * need every id enumerated at build time via `generateStaticParams` — which
 * cannot work once posts come from the API. This page ships as one HTML file and
 * resolves the post client-side from `?id=`.
 *
 * `useSearchParams` bails out of prerendering, so the client component MUST sit
 * behind a Suspense boundary or the export fails to build.
 */
export default function JournalDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <JournalDetails />
    </Suspense>
  );
}
