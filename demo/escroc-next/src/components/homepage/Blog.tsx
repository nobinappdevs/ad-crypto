"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { useSiteSectionData } from "@/hooks/useSiteData";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";
import { toPost } from "@/app/(template)/blog/page";

function BlogSkeleton() {
  return (
    <div className="grid items-stretch gap-7 lg:grid-cols-2">
      <div className="h-96 animate-pulse rounded-3xl bg-primary/5" />
      <div className="flex flex-col gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-primary/5" />
        ))}
      </div>
    </div>
  );
}

export function Blog() {
  const { t, lang } = useLang();
  const { data: res, isLoading } = useSiteSectionData();
  const d = (res as any)?.data;

  const announcements: any[] = d?.announcements ?? [];
  const baseUrl: string = d?.base_url ?? "";
  const blogImagePath: string = d?.blog_image_path ?? "";
  const defaultImage: string = d?.default_image ?? "";

  const posts = announcements
    .map((a) => toPost(a, lang, baseUrl, blogImagePath, defaultImage))
    .slice(0, 4);
  const [featured, ...rest] = posts;

  if (!isLoading && !featured) return null;

  return (
    <section id="blog" className="bg-bg pt-24 lg:pt-32">
      <Container>
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <SectionHeader tag={t("blog.tag")} title={t("blog.title")} />
          <Link href="/blog" className="hidden items-center gap-1.5 font-semibold text-primary sm:inline-flex">
            {t("blog.readMore")}
            <Icon name="arrow" size={15} strokeWidth={2.4} />
          </Link>
        </div>

        {isLoading ? (
          <BlogSkeleton />
        ) : (
          <div className="grid items-stretch gap-7 lg:grid-cols-2">

            {/* ── Featured card (left) ── */}
            <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 transition-all hover:border-primary/40 hover:shadow-card">
              <div className="relative aspect-video overflow-hidden bg-surface">
                {featured.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote CMS image in a static-export app
                  <img
                    src={featured.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {featured.category && (
                  <span className="absolute bottom-4 left-4 rounded-md bg-bg/80 px-2.5 py-1 text-xs font-semibold text-heading backdrop-blur">
                    {featured.category}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("blogPage.author")} &nbsp;·&nbsp; {featured.date}
                </p>
                <h3 className="mt-3 flex-1">{featured.title}</h3>
                <Link href={`/blog-details?slug=${encodeURIComponent(featured.slug)}`} className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary">
                  {t("blog.readMore")}
                  <Icon name="arrow" size={15} strokeWidth={2.4} />
                </Link>
              </div>
            </article>

            {/* ── Stacked cards (right) ── */}
            <div className="flex flex-col gap-5">
              {rest.map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-1 gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all hover:border-primary/40 hover:shadow-card"
                >
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-surface sm:w-28">
                    {post.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- remote CMS image in a static-export app
                      <img
                        src={post.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {post.category && (
                      <span className="absolute bottom-2 left-2 rounded bg-bg/80 px-2 py-0.5 text-[10px] font-semibold text-heading backdrop-blur">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center py-1 pr-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t("blogPage.author")} &nbsp;·&nbsp; {post.date}
                    </p>
                    <h5 className="mt-1.5">{post.title}</h5>
                    <Link href={`/blog-details?slug=${encodeURIComponent(post.slug)}`} className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {t("blog.readMore")}
                      <Icon name="arrow" size={14} strokeWidth={2.4} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

          </div>
        )}
      </Container>
    </section>
  );
}
