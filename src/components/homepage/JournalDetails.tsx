"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { BannerBackdrop } from "@/components/share/BannerBackdrop";
import { JournalCard, JournalCover, JournalPill } from "./JournalCard";
import { findJournalPost, JOURNAL_POSTS } from "@/config/journal";

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/web-journal"
      className="inline-flex! items-center gap-2 text-[13px]! text-hero-fg-muted hover:text-hero-fg"
    >
      <ArrowLeft size={15} aria-hidden className="rtl:rotate-180" />
      {label}
    </Link>
  );
}

export function JournalDetails() {
  const { t } = useLang();
  const post = findJournalPost(useSearchParams().get("id"));

  // The route is one static page, so an unknown or missing `?id=` is a normal
  // state to land in rather than an error — it gets a real message and a way out.
  if (!post) {
    return (
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-42 lg:pt-48">
        <BannerBackdrop />
        <Container className="relative z-10">
          <h1 className="text-hero-fg">{t("webJournal.notFoundTitle")}</h1>
          <p className="mt-4 max-w-140 text-hero-fg-soft">{t("webJournal.notFoundText")}</p>
          <div className="mt-8">
            <BackLink label={t("webJournal.backToList")} />
          </div>
        </Container>
      </section>
    );
  }

  const base = `webJournal.posts.${post.key}`;
  const title = t(`${base}.title`);
  const related = JOURNAL_POSTS.filter((p) => p.key !== post.key).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-10 sm:pt-38 lg:pt-44">
        <BannerBackdrop />

        <Container className="relative z-10">
          <BackLink label={t("webJournal.backToList")} />

          <h1 className="mt-5 max-w-225 tracking-tight text-hero-fg">{title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <JournalPill icon={<CalendarDays size={13} aria-hidden />}>
              {t(`${base}.date`)}
            </JournalPill>
            <JournalPill icon={<Clock size={13} aria-hidden />}>
              {t(`${base}.readTime`)}
            </JournalPill>
          </div>
        </Container>
      </section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <JournalCover
            post={post}
            title={title}
            className="aspect-16/9 w-full sm:aspect-21/9"
            sizes="100vw"
          />

          {/* Capped in `ch` rather than pixels: line length is what governs
              readability, and it should hold whatever the font size resolves to. */}
          <div className="mt-10 max-w-[68ch]">
            <p className="text-[15px]! leading-[1.75]! font-medium text-heading sm:text-[17px]!">
              {t(`${base}.excerpt`)}
            </p>
            <p className="mt-5 leading-[1.8]!">{t(`${base}.body1`)}</p>
            <p className="mt-4 leading-[1.8]!">{t(`${base}.body2`)}</p>
          </div>
        </Container>
      </section>

      <section className="border-t border-border pt-14 pb-20 sm:pt-16">
        <Container>
          <h2>{t("webJournal.relatedTitle")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              // Forced narrow: the related row is a plain three-up grid, so a
              // `wide` post must not try to span two of its columns here.
              <JournalCard key={p.key} post={{ ...p, wide: false }} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
