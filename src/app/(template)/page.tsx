import { HeroScene } from "@/components/homepage/hero/HeroScene";
import { SecuritySystem } from "@/components/homepage/SecuritySystem";
import { Features } from "@/components/homepage/Features";
import { DownloadApp } from "@/components/homepage/DownloadApp";

export const metadata = {
  title: "AdCrypto — Manage, buy and sell crypto in one wallet",
  description:
    "AdCrypto lets you hold multiple cryptocurrencies, trade in and out of your wallet, and stay protected with KYC, 2FA and real-time alerts.",
};

export default function HomePage() {
  return (
    <>
      {/* HeroScene contains the banner AND the How-It-Works panel, so this lands
          directly beneath both. */}
      <HeroScene />
      <SecuritySystem />
      <Features />
      <DownloadApp />
    </>
  );
}
