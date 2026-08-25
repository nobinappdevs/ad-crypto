"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { dsx } from "@/components/dashboard/ui";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { coinBrand, imageUrl } from "@/config/media";
import { num } from "@/config/txlog";
import { walletHref } from "@/config/wallets";
import type { DashboardWallet, ImagePaths } from "@/services/dashboard.service";

/** A holding to at most 8 places, trailing zeros dropped. */
export const walletBalance = (value: string | number | undefined) =>
  num(value).toLocaleString("en-US", { maximumFractionDigits: 8 });


/**
 * One holding: its coin, its balance, and its deposit address. Not a link itself —
 * the address row carries a copy button, which cannot live inside one.
 */
export function WalletCard({ wallet, paths }: { wallet: DashboardWallet; paths: ImagePaths | undefined }) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const code = (wallet.currency?.code ?? "").toUpperCase();
  const brand = coinBrand(code);
  const flag = imageUrl(paths, wallet.currency?.flag);
  const address = wallet.public_address ?? "";

  const [copied, setCopied] = useState(false);
  const [flagBroken, setFlagBroken] = useState(false);

  // Cleared by effect rather than a bare setTimeout: four of these cards mount at
  // once, and a pending timer on one that unmounts (View more collapsing the row)
  // would still be holding a setState for a component that is gone.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      toast.error(k("copyFailed"));
    }
  }

  return (
    <div
      className={cn(
        dsx.card,
        "group relative flex flex-col transition-colors duration-200 hover:border-primary focus-within:border-primary",
      )}
    >
      {/* The card opens the wallet via an overlay, not by wrapping it in a link —
          the copy button sits above the overlay. */}
      <Link
        href={walletHref(code.toLowerCase())}
        aria-label={wallet.currency?.name || code}
        className="absolute inset-0 z-1 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
      />

      <div className="flex items-start justify-between gap-2 px-4.5 pt-4">
        <span className="min-w-0 text-[12.5px]! text-muted transition-colors group-hover:text-primary!">
          {wallet.currency?.name || code}
        </span>

        {/* The API's coin art, with the brand disc as fallback. A plain <img>:
            unoptimized here anyway, and the host comes from an env var. */}
        {flag && !flagBroken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flag}
            alt=""
            width={34}
            height={34}
            loading="lazy"
            onError={() => setFlagBroken(true)}
            className="h-8.5 w-8.5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <CoinBadge color={brand.color} glyph={brand.glyph} size={34} />
        )}
      </div>

      <div className="px-4.5 pb-4">
        {/* The ticker rides the brand colour so the figure and its unit read as
            one value rather than two. */}
        <div className="text-[26px]! leading-none! font-bold! tracking-[-0.02em]">
          {walletBalance(wallet.balance)} <span className="inline! font-bold! text-primary">{code}</span>
        </div>
      </div>

      {/* The deposit address, below a rule so it reads as a detail on the holding
          rather than a second competing figure. */}
      {address && (
        <div className="mt-auto flex items-center gap-2 border-t border-border px-4.5 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[11px]! text-muted">{k("depositAddress")}</span>
            <span className="block truncate font-mono text-[11.5px]! text-heading">{address}</span>
          </span>
          <button
            type="button"
            onClick={copyAddress}
            aria-label={copied ? k("copied") : k("copyAddress")}
            title={copied ? k("copied") : k("copyAddress")}
            className={cn(
              // Above the card's link overlay, or the click would navigate
              // instead of copying.
              "relative z-2 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg transition",
              copied ? "bg-primary/10 text-primary" : "text-muted hover:bg-primary/10 hover:text-primary",
            )}
          >
            {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
