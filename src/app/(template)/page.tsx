import { HeroScene } from "@/components/homepage/hero/HeroScene";
import { Features } from "@/components/homepage/Features";

export const metadata = {
  title: "AdCrypto — Manage, buy and sell crypto in one wallet",
  description:
    "AdCrypto lets you hold multiple cryptocurrencies, trade in and out of your wallet, and stay protected with KYC, 2FA and real-time alerts.",
};

export default function HomePage() {
  return (
    <>
      <HeroScene />
      <Features />
    </>
  );
}
