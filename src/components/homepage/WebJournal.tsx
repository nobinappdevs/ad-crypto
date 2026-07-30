"use client";

import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { JournalCard } from "./JournalCard";
import { JOURNAL_POSTS } from "@/config/journal";

export function WebJournal() {
  const { t } = useLang();

  return (
    <section className="pt-14 pb-20 sm:pt-16">
      <Container>
        <p className="max-w-140">{t("webJournal.subtitle")}</p>

        {/* Four columns so a `wide` card can take exactly half a row. */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNAL_POSTS.map((post) => (
            <JournalCard key={post.key} post={post} />
          ))}
        </div>
      </Container>
    </section>
  );
}
