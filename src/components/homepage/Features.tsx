"use client";

import {
  ArrowLeftRight,
  BellRing,
  KeyRound,
  Layers,
  Mail,
  Repeat,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Upload,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  multiWallet: Wallet,
  buyInside: ShoppingCart,
  buyOutside: Tag,
  sellInside: ArrowLeftRight,
  sellOutside: Repeat,
  withdraw: Upload,
  exchange: Layers,
  pushNotification: BellRing,
  emailVerification: Mail,
  kyc: ShieldCheck,
  twoFa: KeyRound,
};

const FEATURE_KEYS = Object.keys(FEATURE_ICONS);

export function Features() {
  const { t } = useLang();

  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2>{t("home.featuresTitle")}</h2>
          <p className="mt-3">{t("home.featuresSubtitle")}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <div
                key={key}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </span>
                <h5 className="mt-4">{t(`home.features.${key}.title`)}</h5>
                <p className="mt-2">{t(`home.features.${key}.text`)}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
