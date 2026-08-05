import { Suspense } from "react";
import { WalletDetails } from "@/components/dashboard/page/WalletDetails";

export const metadata = {
  title: "Wallet — AdCrypto",
};

/**
 * One static page reading `?coin=`, rather than a `[coin]` segment.
 *
 * The app is a static export (`output: "export"`), so a dynamic segment would need
 * every wallet enumerated at build time via `generateStaticParams` — which stops
 * working the moment the wallet list comes from the API. Same call, and the same
 * Suspense requirement, as `/web-journal/details`: `useSearchParams` opts out of
 * prerendering, so the client component has to sit behind a boundary or the export
 * fails to build.
 */
export default function WalletPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <WalletDetails />
    </Suspense>
  );
}
