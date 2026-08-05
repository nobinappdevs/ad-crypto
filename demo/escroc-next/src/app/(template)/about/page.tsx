"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

const TEAM_INITIALS = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

export default function AboutPage() {
  const { t } = useLang();
  const values = t("aboutPage.values.items");
  const valuesList = Array.isArray(values) ? values : [];
  const members = t("aboutPage.team.members");
  const membersList = Array.isArray(members) ? members : [];
  const points = t("about.points");
  const pointsList = Array.isArray(points) ? points : [];

  return (
    <>
      {/* Hero */}

      {/* Mission */}
      <section className="bg-bg py-24 lg:py-32">
        <Container className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeader tag={t("aboutPage.mission.tag")} title={t("aboutPage.mission.title")} />
            <p className="mt-6 leading-relaxed text-muted">{t("aboutPage.mission.desc")}</p>
            <ul className="mt-9 space-y-4">
              {pointsList.map((point, i) => (
                <li key={point} className="flex items-center gap-4 border-b border-border pb-4 last:border-0">
                  <span className="font-mono text-sm font-semibold text-primary/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon name="check" size={15} strokeWidth={2.6} />
                  </span>
                  <span className="font-medium text-body">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative graphic */}
          <div className="relative">
            <div aria-hidden className="absolute -left-4 -top-4 h-24 w-24 rounded-tl-3xl border-l-2 border-t-2 border-primary/40" />
            <div aria-hidden className="absolute -bottom-4 -right-4 h-24 w-24 rounded-br-3xl border-b-2 border-r-2 border-primary/40" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10">
              <div aria-hidden className="absolute inset-10 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { value: "10M+", label: "aboutPage.statTransactions" },
                  { value: "190+", label: "aboutPage.statCountries" },
                  { value: "99.9%", label: "aboutPage.statUptime" },
                  { value: "24/7", label: "aboutPage.statSupport" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center rounded-2xl bg-primary/8 p-6 text-center">
                    <span className="text-3xl font-bold text-primary">{s.value}</span>
                    <span className="mt-1 text-sm text-muted">{t(s.label)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-surface py-24 lg:py-32">
        <Container>
          <SectionHeader
            tag={t("aboutPage.values.tag")}
            title={t("aboutPage.values.title")}
            align="center"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valuesList.map((item, i) => (
              <article
                key={item.title}
                className="group rounded-3xl border border-border bg-card p-7 transition-all hover:border-primary/40 hover:shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon name={item.icon} size={22} />
                </span>
                <h5 className="mt-5">{item.title}</h5>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="bg-bg py-24 lg:py-32">
        <Container>
          <SectionHeader
            tag={t("aboutPage.team.tag")}
            title={t("aboutPage.team.title")}
            align="center"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {membersList.map((member) => (
              <div
                key={member.name}
                className="group flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center transition-all hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  {TEAM_INITIALS(member.name)}
                </div>
                <p className="mt-4 font-semibold text-heading">{member.name}</p>
                <p className="mt-1 text-sm text-muted">{member.role}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-surface py-24">
        <Container>
          <div className="rounded-3xl border border-primary/20 bg-primary/8 p-12 text-center">
            <h2>{t("aboutPage.cta.title")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t("aboutPage.cta.subtitle")}</p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30"
            >
              {t("aboutPage.cta.button")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
