"use client";

import { useState } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Container } from "@/components/share/Container";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useJournalCategories, useJournals, useJournalsByCategory } from "@/hooks/useWebsite";
import { isWideCard } from "@/config/journal";
import { JournalCard, JournalCardSkeleton } from "./JournalCard";

/**
 * The journal index, from `GET /website/journal/all`.
 *
 * Picking a category switches the grid onto `journal/category/{slug}` — the
 * server's own filtered list. Both queries stay mounted and are toggled with
 * `enabled`, so stepping back to "All" is instant.
 */
export function WebJournal() {
  const { t } = useLang();
  const k = (name: string) => t(`webJournal.${name}`);

  /** "" is every category, which the API expresses as a different endpoint. */
  const [categorySlug, setCategorySlug] = useState("");

  const categories = useJournalCategories();
  const all = useJournals(categorySlug === "");
  const filtered = useJournalsByCategory(categorySlug, categorySlug !== "");

  const active = categorySlug === "" ? all : filtered;
  const journals = (categorySlug === "" ? all.data?.journals : filtered.data?.journals) ?? [];
  const paths = (categorySlug === "" ? all.data : filtered.data)?.image_paths;

  return (
    <section className="pt-14 pb-20 sm:pt-16">
      <Container>
        <p className="max-w-140">{k("subtitle")}</p>

        {/* Filters. Chips rather than a dropdown: the counts are the reason to
            pick one, and a dropdown hides them behind a click. */}
        {(categories.data?.categories?.length ?? 0) > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {[{ slug: "", name: k("allCategories") }, ...(categories.data?.categories ?? [])].map(
              (category) => {
                const slug = category.slug ?? "";
                const isActive = slug === categorySlug;
                const count = "blog_count" in category ? category.blog_count : undefined;

                return (
                  <button
                    key={slug || "all"}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setCategorySlug(slug)}
                    /* `inline-flex` + `whitespace-nowrap`: the name and its count stay
                       on one line, and a two-word category cannot drag the row's height. */
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition",
                      isActive
                        ? "bg-primary text-white"
                        : "border border-border text-muted hover:border-primary hover:text-primary",
                    )}
                  >
                    {category.name}
                    {count != null && (
                      /* The `!`s override the global `span` rule, which makes a bare
                         span a BLOCK at body size — that is what put the count on its
                         own line and stretched the pill. */
                      <span
                        className={cn(
                          "inline-flex! min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px]! leading-none! font-semibold! tabular-nums",
                          isActive ? "bg-white/20 text-white!" : "bg-border/50 text-muted!",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}

        {/* Four columns so a wide card can take exactly half a row. */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {active.isPending &&
            Array.from({ length: 6 }, (_, i) => (
              <JournalCardSkeleton key={i} wide={isWideCard(i)} />
            ))}

          {!active.isPending &&
            journals.map((journal, index) => (
              <JournalCard
                key={journal.slug || journal.id || index}
                journal={journal}
                paths={paths}
                index={index}
                wide={isWideCard(index)}
              />
            ))}
        </div>

        {active.isError && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center">
            <span
              aria-hidden
              className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
            >
              <TriangleAlert size={20} />
            </span>
            <h3 className="mt-4">{k("loadFailed")}</h3>
            <p className="mx-auto mt-2 max-w-100">{getApiErrorMessage(active.error)}</p>
            <button
              type="button"
              onClick={() => active.refetch()}
              className="btn-lift mt-6 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
            >
              <RotateCcw size={15} aria-hidden />
              {k("retry")}
            </button>
          </div>
        )}

        {!active.isPending && !active.isError && journals.length === 0 && (
          <p className="mt-10 rounded-3xl border border-border bg-card px-6 py-14 text-center">
            {k("empty")}
          </p>
        )}
      </Container>
    </section>
  );
}
