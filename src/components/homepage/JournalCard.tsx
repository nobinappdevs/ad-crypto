"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { journalHref, type JournalPost } from "@/config/journal";

export function JournalCover({
  post,
  title,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  post: JournalPost;
  title: string;
  className?: string;
  sizes?: string;
}) {
  return (
    // The gradient stays painted underneath the image rather than being swapped
    // out for it, so the cover is never a blank hole while the file loads — and
    // it still covers any post that has no `image` at all.
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-2xl", className)}
      style={{ background: post.cover }}
    >
      {post.image && (
        <Image src={post.image} alt={title} fill sizes={sizes} className="object-cover" />
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

export function JournalCard({ post }: { post: JournalPost }) {
  const { t } = useLang();
  const title = t(`webJournal.posts.${post.key}.title`);

  return (
    <article
      className={cn(
        // The padding is what gives the inset-image look: the cover is rounded
        // inside an already-rounded card rather than bleeding to its edges.
        "group flex flex-col rounded-3xl border border-border bg-card p-3 shadow-card transition duration-200 hover:-translate-y-1",
        post.wide && "lg:col-span-2 lg:flex-row lg:gap-1",
      )}
    >
      <JournalCover
        post={post}
        title={title}
        className={cn("aspect-16/10", post.wide && "lg:aspect-auto lg:w-1/2")}
      />

      <div
        className={cn("flex flex-1 flex-col px-2 pt-4 pb-1", post.wide && "lg:justify-center lg:p-6")}
      >
        <h4 className="line-clamp-2">{title}</h4>

        <p className="mt-2 line-clamp-3">{t(`webJournal.posts.${post.key}.excerpt`)}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <JournalPill icon={<CalendarDays size={13} aria-hidden />}>
            {t(`webJournal.posts.${post.key}.date`)}
          </JournalPill>
          <JournalPill icon={<Clock size={13} aria-hidden />}>
            {t(`webJournal.posts.${post.key}.readTime`)}
          </JournalPill>
        </div>

        <Link
          href={journalHref(post.key)}
          className="mt-5 inline-flex! h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-primary/90 hover:text-white"
        >
          {t("webJournal.readArticle")}
          <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
    </article>
  );
}
