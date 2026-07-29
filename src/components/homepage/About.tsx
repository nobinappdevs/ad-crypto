"use client";

import { Eye, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";

const VALUE_KEYS = ["security", "simplicity", "transparency"] as const;
const VALUE_ICONS = { security: ShieldCheck, simplicity: Sparkles, transparency: Eye };

export function About() {
  const { t } = useLang();

  return (
    <>
      <section className="bg-surface py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <span className="inline-block! text-[13px] font-semibold uppercase tracking-wide text-primary">
            {t("about.eyebrow")}
          </span>
          <h1 className="mt-3">{t("about.title")}</h1>
          <p className="mt-4">{t("about.intro")}</p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <Target className="text-primary" size={22} />
            <h3 className="mt-4">{t("about.missionTitle")}</h3>
            <p className="mt-2">{t("about.missionText")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <Eye className="text-primary" size={22} />
            <h3 className="mt-4">{t("about.visionTitle")}</h3>
            <p className="mt-2">{t("about.visionText")}</p>
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <h2 className="text-center">{t("about.valuesTitle")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {VALUE_KEYS.map((key) => {
              const Icon = VALUE_ICONS[key];
              return (
                <div key={key} className="rounded-2xl border border-border bg-card p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={20} />
                  </span>
                  <h5 className="mt-4">{t(`about.values.${key}.title`)}</h5>
                  <p className="mt-2">{t(`about.values.${key}.text`)}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
