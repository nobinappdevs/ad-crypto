"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Tag } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { imageUrl } from "@/config/media";
import { journalCover, journalDate, journalHref } from "@/config/journal";
import type { ImagePaths } from "@/services/dashboard.service";
import type { JournalSummary } from "@/services/website.service";

/**
 * The cover.
 *
 * A plain `<img>`, not `next/image`: the app is a static export with the image
 * optimizer switched off, and the host arrives in the payload's own
 * `image_paths.base_url` — pinning it in next.config's `remotePatterns` would
 * break the day the backend moves. Same call the dashboard's wallet art makes.
 */
export function JournalCover({
  journal,
  paths,
  index = 0,
  className,
}: {
  journal: JournalSummary;
  paths: ImagePaths | undefined;
  index?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = imageUrl(paths, journal.image);

  return (
    // The gradient stays painted underneath rather than being swapped out for the
    // image, so the cover is never a blank hole while the file loads — and it
    // still covers any post published without artwork.
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-2xl", className)}
      style={{ background: journalCover(index) }}
    >
      {src && !broken && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={journal.title ?? ""}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

export function JournalPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex! items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] text-muted">
      {icon}
      {children}
    </span>
  );
}

export function JournalCard({
  journal,
  paths,
  index = 0,
  wide = false,
}: {
  journal: JournalSummary;
  paths: ImagePaths | undefined;
  index?: number;
  wide?: boolean;
}) {
  const { t, lang } = useLang();
  const published = journalDate(journal.created_at, lang);

  return (
    <article
      className={cn(
        // The padding is what gives the inset-image look: the cover is rounded
        // inside an already-rounded card rather than bleeding to its edges.
        "group flex flex-col rounded-3xl border border-border bg-card p-3 shadow-card transition duration-200 hover:-translate-y-1",
        wide && "lg:col-span-2 lg:flex-row lg:gap-1",
      )}
    >
      <JournalCover
        journal={journal}
        paths={paths}
        index={index}
        className={cn("aspect-16/10", wide && "lg:aspect-auto lg:w-1/2")}
      />

      <div className={cn("flex flex-1 flex-col px-2 pt-4 pb-1", wide && "lg:justify-center lg:p-6")}>
        <h4 className="line-clamp-2">{journal.title}</h4>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {journal.category?.name && (
            <JournalPill icon={<Tag size={13} aria-hidden />}>{journal.category.name}</JournalPill>
          )}
          {published && (
            <JournalPill icon={<CalendarDays size={13} aria-hidden />}>{published}</JournalPill>
          )}
        </div>

        <Link
          href={journalHref(journal.slug)}
          className="mt-5 inline-flex! h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-primary/90 hover:text-white"
        >
          {t("webJournal.readArticle")}
          <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
    </article>
  );
}

/** A card-shaped placeholder, so the grid holds its shape while the list loads. */
export function JournalCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex animate-pulse flex-col rounded-3xl border border-border bg-card p-3",
        wide && "lg:col-span-2 lg:flex-row lg:gap-1",
      )}
    >
      <div
        className={cn(
          "aspect-16/10 shrink-0 rounded-2xl bg-black/8 dark:bg-white/10",
          wide && "lg:aspect-auto lg:w-1/2",
        )}
      />
      <div className={cn("flex flex-1 flex-col px-2 pt-4 pb-1", wide && "lg:justify-center lg:p-6")}>
        <span className="block h-4 w-full rounded bg-black/8 dark:bg-white/10" />
        <span className="mt-2 block h-4 w-2/3 rounded bg-black/8 dark:bg-white/10" />
        <span className="mt-4 flex gap-2">
          <span className="block h-6 w-24 rounded-full bg-black/5 dark:bg-white/6" />
          <span className="block h-6 w-28 rounded-full bg-black/5 dark:bg-white/6" />
        </span>
        <span className="mt-5 block h-12 w-full rounded-xl bg-black/5 dark:bg-white/6" />
      </div>
    </div>
  );
}
