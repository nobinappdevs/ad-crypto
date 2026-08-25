"use client";

import { RotateCcw, TriangleAlert, Wallet } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/ui";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { WalletsSkeleton } from "@/components/dashboard/Skeletons";

/**
 * Every holding on the account, from the same `GET /user/dashboard` the overview
 * reads — the wallet list is part of that payload, so this page costs no request
 * of its own: React Query hands it the copy already in the cache and refreshes it
 * in the background.
 *
 * The overview shows the first four cards and links here for the rest. Same card,
 * imported rather than reimplemented, so the deposit address and its copy button
 * behave identically in both places.
 */
export function AllWallets() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const { data, isPending, isError, error, refetch } = useDashboard();

  const wallets = data?.wallets ?? [];

  if (isPending) return <WalletsSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
      <DashPageHeader
        title={k("myWallets")}
        subtitle={k("walletsSubtitle")}
        action={
          wallets.length > 0 ? (
            <span className="inline-flex! items-center rounded-full border border-border px-3.5 py-1.5 text-[12.5px]! font-semibold! text-muted!">
              {k("walletsCount").replace("{count}", String(wallets.length))}
            </span>
          ) : undefined
        }
      />

      {isError ? (
        <Panel className="mt-6 p-6 text-center">
          <span
            aria-hidden
            className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
          >
            <TriangleAlert size={20} />
          </span>
          <h2 className="mt-4 text-[16px]! font-bold!">{k("loadFailed")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {getApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
          >
            <RotateCcw size={15} aria-hidden />
            {k("retry")}
          </button>
        </Panel>
      ) : wallets.length === 0 ? (
        <Panel className="mt-6 flex flex-col items-center px-6 py-14 text-center">
          <span
            aria-hidden
            className="grid! h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
          >
            <Wallet size={20} />
          </span>
          <p className="mt-4 text-[14px]! font-bold!">{k("noWalletsTitle")}</p>
          <p className="mt-1 max-w-90 text-[12.5px]! leading-relaxed! text-muted">
            {k("noWalletsDesc")}
          </p>
        </Panel>
      ) : (
        // The same four-column grid as the overview, so a card is the same size in
        // both places and the eye doesn't have to re-learn the row.
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {wallets.map((wallet, i) => (
            <WalletCard key={wallet.id ?? i} wallet={wallet} paths={data?.currency_image_paths} />
          ))}
        </div>
      )}
    </div>
  );
}
