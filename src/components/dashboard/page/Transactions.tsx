"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, RotateCcw, Search, TriangleAlert } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useInfiniteTransactionLogs } from "@/hooks/useTransactions";
import { cn } from "@/components/ui/cn";
import { Panel, PanelTitle } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { TransactionsSkeleton, TxRowsSkeleton } from "@/components/dashboard/Skeletons";
import { RecentTransactions } from "./RecentTransactions";

/**
 * The full ledger, from `GET /user/transaction/logs` — the overview's table over
 * every row, with the filters a full listing needs.
 *
 * Both filters are the SERVER's: the endpoint takes a `type` and a partial
 * `trx_id`, and it paginates. Filtering one page in the browser would search ten
 * rows and call it a result.
 *
 * The pages are joined into one list that grows as it is scrolled — a ledger is
 * read by scanning down it, and a pager makes the reader stop, aim and click to
 * carry on doing the one thing they were already doing.
 */

/** The endpoint's own `type` values. "" is every type, which it expresses by omission. */
const FILTERS = ["", "buy", "sell", "withdraw", "exchange"] as const;

const PER_PAGE = 15;

/** How long a keystroke waits before it becomes a request. */
const SEARCH_DEBOUNCE = 400;

/** How far below the last row the next page starts loading. */
const PREFETCH_MARGIN = "320px";

export function Transactions() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const [type, setType] = useState<(typeof FILTERS)[number]>("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  // Typing does not fire a request per character. The committed value is what the
  // query key is built from, so the cache holds one entry per SEARCH, not per
  // keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), SEARCH_DEBOUNCE);
    return () => clearTimeout(id);
  }, [query]);

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteTransactionLogs({ type, trx_id: search, per_page: PER_PAGE });

  const rows = data?.rows ?? [];
  const total = data?.total ?? rows.length;

  /**
   * The end of the list, watched: once it comes within `PREFETCH_MARGIN` of the
   * viewport the next page is already on its way, so the rows arrive before the
   * reader gets to where they go.
   *
   * A callback ref rather than an effect on a stable ref — the sentinel unmounts
   * with the last page and remounts with the next filter, and this observes it
   * whenever that happens rather than once on mount.
   */
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinel = useCallback(
    (node: HTMLDivElement | null) => {
      observer.current?.disconnect();
      if (!node) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) fetchNextPage();
        },
        { rootMargin: PREFETCH_MARGIN },
      );
      observer.current.observe(node);
    },
    [fetchNextPage],
  );

  useEffect(() => () => observer.current?.disconnect(), []);

  const header = (
    <DashPageHeader
      title={k("nav.transactions")}
      subtitle={k("transactionsPage.subtitle")}
      action={
        <button
          type="button"
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 text-[13px] font-medium text-heading transition hover:border-primary"
        >
          <Download size={15} className="text-muted" />
          {k("download")}
        </button>
      }
    />
  );

  // The whole page while there is nothing at all; past that the panel keeps its
  // header and filters and only the ROWS become a skeleton.
  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
        {header}
        <TransactionsSkeleton header={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
        {header}
        <Panel className="mt-6 p-6 text-center">
          <span
            aria-hidden
            className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
          >
            <TriangleAlert size={20} />
          </span>
          <h2 className="mt-4 text-[16px]! font-bold!">{k("transactionsPage.loadFailed")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {getApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
          >
            <RotateCcw size={15} aria-hidden />
            {k("retry")}
          </button>
        </Panel>
      </div>
    );
  }

  /** A page arriving at the bottom must not dim the rows already read. */
  const switching = isFetching && !isFetchingNextPage;

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
      {header}

      <Panel className="mt-6">
        <PanelTitle hint={k("table.rowCount").replace("{count}", String(total))}>
          {k("nav.all")}
        </PanelTitle>

        {/* Filters. A row of chips rather than a dropdown: five options fit, and a
            visible state beats one hidden behind a click. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-4 pb-4 sm:px-5">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((option) => {
              const active = type === option;
              return (
                <button
                  key={option || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(option)}
                  className={cn(
                    "h-8 cursor-pointer rounded-lg px-3 text-[12.5px] font-semibold transition",
                    active
                      ? "bg-primary text-white"
                      : "border border-border text-muted hover:border-primary hover:text-heading",
                  )}
                >
                  {option ? k(`txType.${option}`) : k("filters.all")}
                </button>
              );
            })}
          </div>

          <div className="ms-auto flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 transition focus-within:border-primary sm:max-w-64">
            <Search size={14} aria-hidden className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={k("transactionsPage.searchPlaceholder")}
              aria-label={k("transactionsPage.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-heading outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* A new filter is a new list, so the rows go and the skeleton stands in —
            the old rows dimmed under a new heading read as the answer, and they are
            not. A page arriving at the BOTTOM is different: those rows stay put and
            the skeleton is appended under them. */}
        {switching ? (
          <TxRowsSkeleton rows={Math.min(Math.max(rows.length, 4), PER_PAGE)} />
        ) : rows.length === 0 && (search || type) ? (
          <p className="px-4 py-14 text-center text-[13px]! text-muted sm:px-5">
            {k("transactionsPage.empty")}
          </p>
        ) : (
          <>
            <RecentTransactions rows={rows} />
            {isFetchingNextPage && (
              <TxRowsSkeleton rows={3} className="border-t border-border" />
            )}
          </>
        )}

        {/* The foot of the list: what is loading, or the way to ask for more, or
            the fact that there is no more. */}
        {!switching && rows.length > 0 && (
          <div
            aria-live="polite"
            className="flex flex-col items-center gap-2 border-t border-border px-4 py-4 sm:px-5"
          >
            {hasNextPage ? (
              <>
                {/* The observer does the work; the button is the keyboard's way to
                    the same thing, and the fallback if the observer never fires. */}
                <div ref={sentinel} aria-hidden className="h-px w-full" />
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-[12.5px] font-semibold text-heading transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFetchingNextPage && (
                    <Loader2 size={14} aria-hidden className="animate-spin text-primary" />
                  )}
                  {isFetchingNextPage
                    ? k("transactionsPage.loadingMore")
                    : k("transactionsPage.loadMore")}
                </button>
              </>
            ) : (
              <p className="text-[12.5px]! text-muted">{k("transactionsPage.end")}</p>
            )}

            <p className="text-[12px]! text-muted/80 tabular-nums">
              {k("transactionsPage.loaded")
                .replace("{count}", String(rows.length))
                .replace("{total}", String(total))}
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
