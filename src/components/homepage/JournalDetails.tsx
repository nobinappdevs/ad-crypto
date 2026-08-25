"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, RotateCcw, Tag } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Container } from "@/components/share/Container";
import { BannerBackdrop } from "@/components/share/BannerBackdrop";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useJournalDetails } from "@/hooks/useWebsite";
import { journalDate } from "@/config/journal";
import { JournalCard, JournalCover, JournalPill } from "./JournalCard";

/**
 * One article, from `GET /website/journal/details/{slug}`.
 *
 * A static page reading `?slug=`, not a `[slug]` segment — a static export would
 * have to enumerate every article at build time (hence the Suspense boundary too).
 * The rail beside it varies by build: `recent_posts` or the `category` index,
 * whichever arrives.
 */
export function JournalDetails() {
  const { t, lang } = useLang();
  const k = (name: string) => t(`webJournal.${name}`);

  const slug = (useSearchParams().get("slug") ?? "").trim();
  const { data, isPending, isError, error, refetch } = useJournalDetails(slug);

  const journal = data?.journal;
  const paths = data?.image_paths;
  const related = data?.recent_posts?.filter((post) => post.slug !== slug).slice(0, 3) ?? [];
  const categories = data?.category ?? [];

  if (slug && isPending) return <DetailsSkeleton />;

  // A missing slug and a 404 are the same thing to the reader: the link does not
  // point at an article. The API's own message is shown when there is one.
  if (!slug || isError || !journal) {
    return (
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-42 lg:pt-48">
        <BannerBackdrop />
        <Container className="relative z-10">
          <h1 className="text-hero-fg">{k("notFoundTitle")}</h1>
          <p className="mt-4 max-w-140 text-hero-fg-soft">
            {isError ? getApiErrorMessage(error) : k("notFoundText")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <BackLink label={k("backToList")} />
            {isError && (
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-hero-fg-muted hover:text-hero-fg"
              >
                <RotateCcw size={14} aria-hidden />
                {k("retry")}
              </button>
            )}
          </div>
        </Container>
      </section>
    );
  }

  const published = journalDate(journal.created_at, lang);

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-10 sm:pt-38 lg:pt-44">
        <BannerBackdrop />

        <Container className="relative z-10">
          <BackLink label={k("backToList")} />

          <h1 className="mt-5 max-w-225 tracking-tight text-hero-fg">{journal.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {journal.category?.name && (
              <JournalPill icon={<Tag size={13} aria-hidden />}>{journal.category.name}</JournalPill>
            )}
            {published && (
              <JournalPill icon={<CalendarDays size={13} aria-hidden />}>{published}</JournalPill>
            )}
          </div>
        </Container>
      </section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <JournalCover
            journal={journal}
            paths={paths}
            className="aspect-16/9 w-full sm:aspect-21/9"
          />

          {/* The body is HTML from the operator's own editor, so it is injected
              rather than escaped — first-party content from the same backend.
              Capped in `ch`, since line length is what governs readability, and the
              child selectors give the injected tags the page's rhythm. */}
          {journal.description && (
            <div
              className="mt-10 max-w-[68ch] [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h3]:mt-6 [&_img]:mt-6 [&_img]:rounded-2xl [&_li]:list-disc [&_p]:mt-4 [&_p]:leading-[1.8] [&_ul]:mt-4 [&_ul]:ps-5"
              dangerouslySetInnerHTML={{ __html: journal.description }}
            />
          )}

          {journal.tags && journal.tags.length > 0 && (
            <div className="mt-8 flex max-w-[68ch] flex-wrap items-center gap-2">
              {journal.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1 text-[12.5px] font-semibold text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Container>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border pt-14 pb-20 sm:pt-16">
          <Container>
            <h2>{k("relatedTitle")}</h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((post, index) => (
                // Never wide here: the related row is a plain three-up grid, so a
                // card spanning two columns would break it.
                <JournalCard
                  key={post.slug || post.id || index}
                  journal={post}
                  paths={paths}
                  index={index}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {related.length === 0 && categories.length > 0 && (
        <section className="border-t border-border pt-14 pb-20 sm:pt-16">
          <Container>
            <h2>{k("browseCategories")}</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href="/web-journal"
                  className="inline-flex! h-9 items-center gap-1.5 rounded-full border border-border px-4 text-[13px] font-semibold text-muted hover:border-primary hover:text-primary"
                >
                  {category.name}
                  {category.blog_count != null && (
                    <span className="text-muted">{category.blog_count}</span>
                  )}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

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

/** Traces the article: banner heading, cover, then the column of body text. */
function DetailsSkeleton() {
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-10 sm:pt-38 lg:pt-44">
        <BannerBackdrop />
        <Container className="relative z-10">
          <div aria-hidden className="animate-pulse">
            <span className="block h-3 w-40 rounded bg-white/15" />
            <span className="mt-6 block h-9 w-full max-w-200 rounded bg-white/20" />
            <span className="mt-3 block h-9 w-2/3 max-w-140 rounded bg-white/15" />
            <span className="mt-6 flex gap-2">
              <span className="block h-7 w-28 rounded-full bg-white/12" />
              <span className="block h-7 w-32 rounded-full bg-white/12" />
            </span>
          </div>
        </Container>
      </section>

      <section className="pb-20 sm:pb-24">
        <Container>
          <div aria-hidden className="animate-pulse">
            <span className="block aspect-16/9 w-full rounded-2xl bg-black/8 sm:aspect-21/9 dark:bg-white/10" />
            <span className="mt-10 flex max-w-[68ch] flex-col gap-3">
              {[100, 96, 92, 98, 70].map((width, i) => (
                <span
                  key={i}
                  style={{ width: `${width}%` }}
                  className="block h-4 rounded bg-black/6 dark:bg-white/8"
                />
              ))}
            </span>
          </div>
        </Container>
      </section>
    </>
  );
}
