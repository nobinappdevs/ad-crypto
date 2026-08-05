"use client";

import { Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/hooks/useLang";
import { useSiteSectionData } from "@/hooks/useSiteData";
import { Container } from "@/components/share/Container";
import { SectionHeader } from "@/components/share/SectionHeader";
import { Icon } from "@/components/share/Icons";
import { toPost } from "@/app/(template)/blog/page";

// Gradient covers mirror the blog listing page so posts feel like one set
// even when an article has no cover image.
const COVERS = [
  "from-primary/40 via-primary/15 to-primary/5",
  "from-muted/40 via-muted/15 to-muted/5",
  "from-primary/30 via-primary/10 to-muted/10",
  "from-primary/35 via-primary/12 to-primary/5",
  "from-muted/30 via-primary/10 to-primary/5",
  "from-primary/25 via-muted/12 to-muted/5",
];

// Reading-progress bar that fills as the reader scrolls the article.
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      setProgress(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Brand marks — lucide no longer ships social logos, so inline the paths.
const BRAND_ICONS: Record<string, ReactNode> = {
  x: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  facebook: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  linkedin: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
};

function BrandIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {BRAND_ICONS[name]}
    </svg>
  );
}

/* Read the current URL client-side without a hydration mismatch or a setState-in-effect. */
const subscribeUrl = () => () => {};
const getUrlSnapshot = () => window.location.href;
const getUrlServerSnapshot = () => "";

function ShareRow() {
  const { t } = useLang();
  const url = useSyncExternalStore(subscribeUrl, getUrlSnapshot, getUrlServerSnapshot);
  const [copied, setCopied] = useState(false);

  const links = [
    { name: "x", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}` },
    { name: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  const copy = () => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2.5">
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white"
        >
          <BrandIcon name={l.name} size={15} />
        </a>
      ))}
      <button
        type="button"
        aria-label={t("blogDetail.copyLink")}
        onClick={copy}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 ${
          copied
            ? "border-primary bg-primary text-white"
            : "border-border text-muted hover:border-primary hover:bg-primary hover:text-white"
        }`}
      >
        <Icon name={copied ? "check" : "link"} size={16} strokeWidth={copied ? 2.6 : 1.9} />
      </button>
    </div>
  );
}

function BlogDetailSkeleton() {
  return (
    <div className="bg-bg pb-24">
      <div className="border-b border-border bg-surface pt-14 pb-20">
        <Container className="max-w-3xl">
          <div className="h-3 w-40 animate-pulse rounded bg-border" />
          <div className="mt-6 h-8 w-3/4 animate-pulse rounded bg-border" />
          <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-border" />
        </Container>
      </div>
      <Container className="mt-14 max-w-3xl space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-border" />
        ))}
      </Container>
    </div>
  );
}

// Static export can't pre-render dynamic segments without generateStaticParams,
// so the post is selected via a query param instead: /blog-details?slug=<slug>.
function BlogDetail() {
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const { data: res, isLoading } = useSiteSectionData();
  const d = (res as any)?.data;

  const announcements: any[] = d?.announcements ?? [];
  const baseUrl: string = d?.base_url ?? "";
  const blogImagePath: string = d?.blog_image_path ?? "";
  const defaultImage: string = d?.default_image ?? "";

  const slug = searchParams.get("slug");
  const posts = announcements.map((a) => toPost(a, lang, baseUrl, blogImagePath, defaultImage));
  const index = posts.findIndex((p) => p.slug === slug);
  const post = index >= 0 ? posts[index] : undefined;

  const related = posts.filter((_, i) => i !== index).slice(0, 3);

  if (isLoading) {
    return <BlogDetailSkeleton />;
  }

  if (!post) {
    return (
      <section className="bg-bg py-32">
        <Container className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="shield" size={30} />
          </div>
          <h2 className="mt-6">{t("blogDetail.notFound")}</h2>
          <p className="mx-auto mt-4 max-w-md text-muted">{t("blogDetail.notFoundDesc")}</p>
          <Link
            href="/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-white shadow-sm shadow-primary/25 transition hover:shadow-md hover:shadow-primary/30"
          >
            <Icon name="arrow" size={16} strokeWidth={2.4} className="rotate-180" />
            {t("blogDetail.backToBlog")}
          </Link>
        </Container>
      </section>
    );
  }

  return (
    <article className="bg-bg pb-24">
      <ReadingProgress />

      {/* ── Hero ── */}
      <header className="relative overflow-hidden border-b border-border bg-surface pt-14 pb-20 lg:pt-20">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <Container className="relative max-w-3xl">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
            <Link href="/" className="hover:text-primary">{t("nav.home")}</Link>
            <Icon name="chevron" size={13} className="text-muted" />
            <Link href="/blog" className="hover:text-primary">{t("blog.tag")}</Link>
            {post.category && (
              <>
                <Icon name="chevron" size={13} className="text-muted" />
                <span className="text-primary">{post.category}</span>
              </>
            )}
          </nav>

          {post.category && (
            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {post.category}
            </span>
          )}

          <h1 className="mt-5 tracking-tight">{post.title}</h1>

          {/* Meta */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Icon name="calendar" size={15} />
              {post.date}
            </div>
          </div>
        </Container>
      </header>

      {/* ── Cover ── */}
      <Container className="max-w-5xl">
        <div
          className={`relative -mt-12 aspect-16/7 overflow-hidden rounded-3xl border border-border bg-linear-to-br shadow-card ${COVERS[post.id % COVERS.length]}`}
        >
          {post.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote CMS image in a static-export app
            <img src={post.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
              <div aria-hidden className="absolute bottom-0 left-1/2 h-40 w-2/3 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            </>
          )}
        </div>
      </Container>

      {/* ── Body + Sidebar ── */}
      <Container className="mt-14 max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Main */}
          <div className="min-w-0 max-w-3xl">
            {/* Article body — rich HTML from the CMS */}
            <div
              className="leading-relaxed text-muted [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-heading [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-heading [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_p:first-of-type]:text-lg [&_p:first-of-type]:text-body [&_strong]:font-semibold [&_strong]:text-heading [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 first:[&_p]:mt-0"
              dangerouslySetInnerHTML={{ __html: post.detailsHtml || post.excerpt }}
            />

            {/* Tags + share */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold text-heading">{t("blogDetail.tagsLabel")}:</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <ShareRow />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Share */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">{t("blogDetail.share")}</p>
                <ShareRow />
              </div>

              {/* CTA */}
              <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/12 to-transparent p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon name="shield" size={22} />
                </div>
                <p className="mt-4 font-bold text-heading">{t("blogDetail.ctaTitle")}</p>
                <p className="mt-2 text-sm text-muted">{t("blogDetail.ctaDesc")}</p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-md hover:shadow-primary/30"
                >
                  {t("blogDetail.ctaButton")}
                  <Icon name="arrow" size={14} strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="mt-24 border-t border-border pt-20">
          <Container>
            <SectionHeader tag={t("blog.tag")} title={t("blogDetail.relatedTitle")} />
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog-details?slug=${encodeURIComponent(rel.slug)}`}
                  className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
                >
                  <div className={`relative aspect-video overflow-hidden bg-linear-to-br ${COVERS[rel.id % COVERS.length]}`}>
                    {rel.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- remote CMS image in a static-export app
                      <img src={rel.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    {rel.category && (
                      <span className="absolute bottom-4 left-4 rounded-md bg-bg/80 px-2.5 py-1 text-xs font-semibold text-heading backdrop-blur">
                        {rel.category}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                      <span className="font-semibold text-primary">{t("blogPage.author")}</span>
                      <span aria-hidden>•</span>
                      <span>{rel.date}</span>
                    </div>
                    <h5 className="mt-3 transition-colors group-hover:text-primary">{rel.title}</h5>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{rel.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {t("blogDetail.readMore")}
                      <Icon name="arrow" size={14} strokeWidth={2.4} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Back to all */}
            <div className="mt-14 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 font-semibold text-heading transition hover:border-primary/40 hover:text-primary"
              >
                <Icon name="arrow" size={16} strokeWidth={2.4} className="rotate-180" />
                {t("blogDetail.backToBlog")}
              </Link>
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}

// useSearchParams must sit under a Suspense boundary for static export/prerender.
export default function BlogDetailsPage() {
  return (
    <Suspense>
      <BlogDetail />
    </Suspense>
  );
}
