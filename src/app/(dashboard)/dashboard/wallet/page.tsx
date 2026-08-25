import { Suspense } from "react";
import { WalletDetails } from "@/components/dashboard/page/WalletDetails";
import { WalletSkeleton } from "@/components/dashboard/Skeletons";

export const metadata = {
  title: "Wallet — AdCrypto",
};

/**
 * One static page reading `?coin=`, not a `[coin]` segment: a static export would
 * have to enumerate every wallet at build time, which the API's list rules out.
 * `useSearchParams` opts out of prerendering, hence the Suspense boundary.
 */
export default function WalletPage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletDetails />
    </Suspense>
  );
}
