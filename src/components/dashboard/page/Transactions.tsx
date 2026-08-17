"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw, Search, TriangleAlert } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useTransactionLogs } from "@/hooks/useTransactions";
import { cn } from "@/components/ui/cn";
import { Panel, PanelTitle } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { TransactionsSkeleton } from "@/components/dashboard/Skeletons";
import { RecentTransactions } from "./RecentTransactions";

/**
 * The full ledger, from `GET /user/transaction/logs`.
 *
 * The same table as the overview's panel — it is the same component — over every
 * row instead of the newest few, with the filters a full listing needs.
 *
 * Both filters are the SERVER's, not this page's: the endpoint takes a `type` and a
 * partial `trx_id`, and it paginates. Filtering a single page in the browser would
 * search ten rows and call it a result, which is worse than no search at all.
 */

/** The endpoint's own `type` values. "" is every type, which it expresses by omission. */
const FILTERS = ["", "buy", "sell", "withdraw", "exchange"] as const;

const PER_PAGE = 10;

/** How long a keystroke waits before it becomes a request. */
const SEARCH_DEBOUNCE = 400;

export function Transactions() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const [type, setType] = useState<(typeof FILTERS)[number]>("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Typing does not fire a request per character. The committed value is what the
  // query key is built from, so the cache holds one entry per SEARCH, not per
  // keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE);
    return () => clearTimeout(id);
  }, [query]);

  const { data, isPending, isFetching, isError, error, refetch } = useTransactionLogs({
    type,
    trx_id: search,
    per_page: PER_PAGE,
    page,
  });

  const paginator = data?.transactions;
  const rows = paginator?.data ?? [];
  const lastPage = paginator?.last_page ?? 1;
  const total = paginator?.total ?? rows.length;
  const current = paginator?.current_page ?? page;

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

  // Only the FIRST load gets a skeleton. A filter change or a page step keeps the
  // previous rows up (see `useTransactionLogs`) and dims them instead.
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
                  onClick={() => {
                    setType(option);
                    setPage(1);
                  }}
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

        {/* Refetching dims the rows rather than replacing them — the page you asked
            for arrives in the shape the page you were on already had. */}
        <div className={cn("transition-opacity", isFetching && "opacity-55")}>
          {rows.length === 0 && (search || type) ? (
            <p className="px-4 py-14 text-center text-[13px]! text-muted sm:px-5">
              {k("transactionsPage.empty")}
            </p>
          ) : (
            <RecentTransactions rows={rows} />
          )}
        </div>

        {lastPage > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border px-4 py-3.5 sm:px-5">
            <p className="text-[12.5px]! text-muted">
              {k("transactionsPage.showing")
                .replace("{from}", String(paginator?.from ?? 0))
                .replace("{to}", String(paginator?.to ?? 0))
                .replace("{total}", String(total))}
            </p>

            <div className="flex items-center gap-2">
              <PageButton
                label={k("transactionsPage.prev")}
                disabled={current <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={15} aria-hidden className="rtl:rotate-180" />
              </PageButton>

              <span className="text-[12.5px]! font-semibold! tabular-nums">
                {k("transactionsPage.page")
                  .replace("{page}", String(current))
                  .replace("{pages}", String(lastPage))}
              </span>

              <PageButton
                label={k("transactionsPage.next")}
                disabled={current >= lastPage || isFetching}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                <ChevronRight size={15} aria-hidden className="rtl:rotate-180" />
              </PageButton>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

/** One step of the pager — icon only, with the direction as its accessible name. */
function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-border text-heading transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-heading"
    >
      {children}
    </button>
  );
}
