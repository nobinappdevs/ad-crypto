"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { EllipsisButton, Panel, PanelTitle } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { TRANSACTIONS } from "@/config/transactions";
import { TransactionsTable } from "./TransactionsTable";

/**
 * The full ledger. Same table as the overview's panel — it is the same component —
 * over every row instead of the newest few, with the filters a full listing needs
 * and the overview has no room for.
 */
const FILTERS = ["all", "buy", "sell", "processing", "success", "declined"] as const;

export function Transactions() {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TRANSACTIONS.filter((row) => {
      // One control, two kinds of filter: a side and a status can never both be
      // active, so a single row of chips is honest about what it does.
      const matchesFilter =
        filter === "all" ||
        filter === row.side ||
        filter === row.status;
      const matchesQuery =
        !needle ||
        `${row.ticker} ${row.company} ${row.ref} ${row.email}`.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6">
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

      <Panel className="mt-6">
        <PanelTitle
          hint={k("table.rowCount").replace("{count}", String(rows.length))}
          action={<EllipsisButton />}
        >
          {k("nav.all")}
        </PanelTitle>

        {/* Filters. A row of chips rather than a dropdown: six options fit, and a
            visible state beats one hidden behind a click. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-4 pb-4 sm:px-5">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((option) => {
              const active = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option)}
                  className={cn(
                    "h-8 cursor-pointer rounded-lg px-3 text-[12.5px] font-semibold transition",
                    active
                      ? "bg-primary text-white"
                      : "border border-border text-muted hover:border-primary hover:text-heading",
                  )}
                >
                  {option === "all" ? k("filters.all") : k(`filters.${option}`)}
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

        {rows.length === 0 ? (
          <p className="px-4 py-14 text-center text-[13px]! text-muted sm:px-5">
            {k("transactionsPage.empty")}
          </p>
        ) : (
          // Keyed on the filter so the selection resets rather than carrying row
          // indexes over to a different set of rows.
          <TransactionsTable key={`${filter}-${query}`} rows={rows} />
        )}
      </Panel>
    </div>
  );
}
