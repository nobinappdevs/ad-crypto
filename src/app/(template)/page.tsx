import { HeroScene } from "@/components/homepage/hero/HeroScene";
import { SecuritySuite } from "@/components/homepage/SecuritySuite";
import { Overview } from "@/components/homepage/Overview";
import { WelcomeApp } from "@/components/homepage/WelcomeApp";

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
      {/* Sticky scroll scene: 620vh of runway that swaps two passes of security
          cards. The grid version of this content now lives on /service. */}
      <SecuritySuite />
      {/* Overview's dome is anchored to its own top edge, so it has to sit
          directly under the scroll scene for the curve to read as a horizon. */}
      <Overview />
      {/* `Features` is deliberately not here: SecuritySuite above covers the same
          ground, and the two together read as the page saying it twice. */}
      <WelcomeApp />
    </>
  );
}
