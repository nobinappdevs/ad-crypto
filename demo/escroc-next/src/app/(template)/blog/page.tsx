"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { useSiteSectionData } from "@/hooks/useSiteData";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";

const COVERS = [
  "from-primary/30 to-primary/5",
  "from-muted/30 to-muted/5",
  "from-primary/20 to-muted/10",
  "from-primary/25 to-primary/8",
  "from-muted/20 to-primary/10",
  "from-primary/15 to-muted/15",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO → "5 Dec 2023", locale-free (keeps SSR/client output identical). */
export function fmtPostDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** Pick the localized string for the active language, falling back to English then any language present. */
export function localizedField<T extends Record<string, any>>(
  wrapper: { language?: Record<string, T> } | undefined,
  lang: string,
  field: keyof T,
): string {
  const langs = wrapper?.language ?? {};
  return langs[lang]?.[field] ?? langs.en?.[field] ?? (Object.values(langs)[0] as T | undefined)?.[field] ?? "";
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Builds the flat post shape both the listing and detail pages render from. */
export function toPost(a: any, lang: string, baseUrl: string, blogImagePath: string, defaultImage: string) {
  const detailsHtml = localizedField(a.details, lang, "details");
  return {
    id: a.id,
    slug: a.slug,
    title: localizedField(a.name, lang, "name"),
    category: a.tags?.[0] ?? "",
    tags: Array.isArray(a.tags) ? a.tags : [],
    excerpt: stripHtml(detailsHtml).slice(0, 150),
    detailsHtml,
    date: fmtPostDate(a.created_at),
    createdAt: a.created_at,
    image: a.image ? `${baseUrl}${blogImagePath}/${a.image}` : defaultImage ? `${baseUrl}${defaultImage}` : "",
  };
}

function BlogSkeleton() {
  return (
    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="aspect-video animate-pulse bg-surface" />
          <div className="space-y-3 p-6">
            <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-surface" />
            <div className="h-3 w-full animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogPage() {
  const { t, lang } = useLang();
  const { data: res, isLoading } = useSiteSectionData();
  const d = (res as any)?.data;

  const categories: any[] = d?.announcement_categories ?? [];
  const announcements: any[] = d?.announcements ?? [];
  const baseUrl: string = d?.base_url ?? "";
  const blogImagePath: string = d?.blog_image_path ?? "";
  const defaultImage: string = d?.default_image ?? "";

  const [active, setActive] = useState("All");

  const posts = announcements.map((a) => toPost(a, lang, baseUrl, blogImagePath, defaultImage));
  const cats = ["All", ...categories.map((c) => c.name)];
  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);

  return (
    <>
      {/* Posts */}
      <section className="bg-bg py-24 lg:py-32">
        <Container>
          {/* Category tabs */}
          <div className="mb-12 flex flex-wrap gap-2">
            {cats.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  active === cat
                    ? "bg-primary text-white"
                    : "border border-border text-muted hover:border-primary/40 hover:text-primary"
                }`}
              >
                {cat === "All" ? t("blogPage.all") : cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <BlogSkeleton />
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="shield" size={26} />
              </div>
              <p className="mt-5 font-semibold text-heading">{t("blogPage.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog-details?slug=${encodeURIComponent(post.slug)}`}
                  className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-card"
                >
                  <div className={`relative aspect-video overflow-hidden bg-linear-to-br ${COVERS[post.id % COVERS.length]}`}>
                    {post.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- remote CMS image in a static-export app
                      <img
                        src={post.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {post.category && (
                      <span className="absolute bottom-4 left-4 rounded-md bg-bg/80 px-2.5 py-1 text-xs font-semibold text-heading backdrop-blur">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                      <span className="font-semibold text-primary">{t("blogPage.author")}</span>
                      <span aria-hidden>•</span>
                      <span>{post.date}</span>
                    </div>
                    <h5 className="mt-3">{post.title}</h5>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {t("blogPage.readMore")}
                      <Icon name="arrow" size={14} strokeWidth={2.4} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Newsletter */}
      <section className="bg-surface py-24">
        <Container>
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <SectionHeader
              tag={t("blogPage.newsletter.tag")}
              title={t("blogPage.newsletter.title")}
              align="center"
            />
            <p className="mx-auto mt-4 max-w-lg text-muted">{t("blogPage.newsletter.subtitle")}</p>
            <form
              className="mx-auto mt-8 flex max-w-md gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={t("blogPage.newsletter.placeholder")}
                className="flex-1 rounded-full border border-border bg-bg px-5 py-3 text-sm text-body placeholder-muted outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30"
              >
                {t("blogPage.newsletter.button")}
              </button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
