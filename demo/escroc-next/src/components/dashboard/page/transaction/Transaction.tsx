"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ShieldCheck, Search, SlidersHorizontal } from "lucide-react";
import { Panel, PanelHeader, StatusBadge, dsx } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { useTransactions } from "@/hooks/useTransactions";

/* transaction-type → icon + readable label */
function txMeta(type: string) {
  const s = (type ?? "").toUpperCase();
  if (s.includes("ADD"))      return { Icon: ArrowDownLeft,  label: "dashboard.types.addMoney", cls: "bg-primary/10 text-primary" };
  if (s.includes("OUT"))      return { Icon: ArrowUpRight,   label: "dashboard.types.moneyOut", cls: "bg-amber-500/12 text-amber-500" };
  if (s.includes("EXCHANGE")) return { Icon: ArrowLeftRight, label: "dashboard.types.exchange",  cls: "bg-indigo-500/12 text-indigo-500" };
  if (s.includes("ESCROW"))   return { Icon: ShieldCheck,    label: "dashboard.types.escrow",    cls: "bg-primary/10 text-primary" };
  return { Icon: ArrowLeftRight, label: (type ?? "—").replace(/-/g, " "), cls: "bg-black/5 text-muted dark:bg-white/10" };
}

/* string_status → StatusBadge tone */
function statusTone(status: string) {
  const s = (status ?? "").toLowerCase();
  if (/success|complete|approved|paid|released/.test(s)) return "success";
  if (/pending|process/.test(s)) return "pending";
  if (/wait/.test(s)) return "info";
  if (/reject|fail|cancel|declin/.test(s)) return "danger";
  return "neutral";
}

// ISO → "YYYY-MM-DD HH:mm" without locale (keeps SSR/client output identical).
const fmtDate = (iso?: string) => (iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "—");
const fmtAmt = (n: any) => Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* type-filter options (matches the transaction_type values the API sends) */
const TYPE_OPTS: SelectOption[] = [
  { value: "", label: "dashboard.types.all" },
  { value: "ADD-MONEY", label: "dashboard.types.addMoney" },
  { value: "MONEY-OUT", label: "dashboard.types.moneyOut" },
  { value: "MONEY-EXCHANGE", label: "dashboard.types.exchange" },
  { value: "ESCROW", label: "dashboard.types.escrow" },
];

/* ───────────────────────── skeleton ───────────────────────── */

function TxSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-border" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-border" />
            <div className="h-3 w-24 animate-pulse rounded bg-border" />
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

/* single table-row skeleton — appended while the next page loads (infinite scroll) */
function TxRowSkeleton() {
  const bar = "h-3 animate-pulse rounded bg-border";
  return (
    <tr className="border-b border-border last:border-0">
      <td className={dsx.td}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-border" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`${bar} w-40`} />
            <div className={`${bar} w-24`} />
          </div>
        </div>
      </td>
      <td className={`${dsx.td} hidden sm:table-cell`}><div className={`${bar} w-20`} /></td>
      <td className={`${dsx.td} hidden md:table-cell`}><div className={`${bar} w-28`} /></td>
      <td className={`${dsx.td} hidden lg:table-cell`}><div className={`${bar} w-24`} /></td>
      <td className={`${dsx.td} hidden lg:table-cell`}><div className={`${bar} w-16`} /></td>
      <td className={`${dsx.td} text-right`}><div className={`${bar} ml-auto w-20`} /></td>
      <td className={`${dsx.td} hidden md:table-cell`}><div className={`${bar} w-24`} /></td>
    </tr>
  );
}

/* ───────────────────────── view ───────────────────────── */

export function Transaction() {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const typeOpts: SelectOption[] = TYPE_OPTS.map((o) => ({ ...o, label: t(o.label) }));

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useTransactions();
  const pages = (data as any)?.pages ?? [];
  const rows: any[] = pages.flatMap((pg: any) => pg?.data?.transactions?.data ?? []);
  const total: number = pages[0]?.data?.transactions?.total ?? rows.length;

  // Infinite scroll — load the next page when the sentinel nears the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Client-side search + type filter over the loaded pages.
  const q = query.trim().toLowerCase();
  const filtering = q !== "" || typeFilter !== "";
  const filtered = rows.filter((tx) => {
    if (typeFilter && !(tx.transaction_type ?? "").toUpperCase().includes(typeFilter)) return false;
    if (q) {
      const hay = [
        tx.trx_id,
        tx.gateway_currency,
        t(txMeta(tx.transaction_type).label),
        tx.string_status,
        tx.sender_currency_code,
        tx.exchange_currency,
        tx.gateway_currency_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <Panel>
      <PanelHeader title={t("dashboard.transaction.title")} badge={total}>
        <div className="w-full sm:flex-1 lg:w-56 lg:flex-none">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={16} strokeWidth={2} aria-hidden />}
            placeholder={t("dashboard.transaction.searchPlaceholder")}
          />
        </div>
        <div className="w-full sm:w-40 sm:shrink-0">
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOpts}
            leftIcon={<SlidersHorizontal size={15} strokeWidth={2} aria-hidden />}
            aria-label={t("dashboard.transaction.filter")}
          />
        </div>
      </PanelHeader>

      {isLoading ? (
        <TxSkeleton />
      ) : rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <ArrowLeftRight size={20} strokeWidth={2} aria-hidden />
          </div>
          <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.transaction.emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted">{t("dashboard.transaction.emptyDesc")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/5 text-muted dark:bg-white/10">
            <Search size={20} strokeWidth={2} aria-hidden />
          </div>
          <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.transaction.noMatchTitle")}</p>
          <p className="mt-1 text-xs text-muted">{t("dashboard.transaction.noMatchDesc")}</p>
        </div>
      ) : (
        <div className="scroll-x">
          <table className="dash-table w-full min-w-210 border-collapse text-left">
            <thead>
              <tr className="border-b-0">
                <th className={dsx.th}>{t("dashboard.transaction.colTransaction")}</th>
                <th className={`${dsx.th} hidden sm:table-cell`}>{t("dashboard.transaction.colStatus")}</th>
                <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.transaction.colTransactionId")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.transaction.colExchangeRate")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.transaction.colFees")}</th>
                <th className={`${dsx.th} text-right`}>{t("dashboard.transaction.colAmount")}</th>
                <th className={`${dsx.th} hidden whitespace-nowrap md:table-cell`}>{t("dashboard.transaction.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const meta = txMeta(tx.transaction_type);
                const isExchange = /EXCHANGE/i.test(tx.transaction_type ?? "");
                const sc = tx.sender_currency_code ?? "";
                // Target currency: gateway for money-in/out, exchange target for exchanges.
                const target = tx.gateway_currency_code ?? tx.exchange_currency ?? sc;
                const feeCur = tx.gateway_currency_code ?? sc;
                return (
                  <tr key={tx.trx_id ?? tx.id} className={dsx.rowHover}>
                    {/* transaction */}
                    <td className={dsx.td}>
                      <div className="flex items-center gap-3">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.cls} [&>svg]:size-4.5`}>
                          <meta.Icon size={18} strokeWidth={2} aria-hidden />
                        </div>
                        <div>
                          {/* nowrap, not truncate — the table scrolls, so the label
                              should claim its width instead of being ellipsised */}
                          <div className="whitespace-nowrap text-sm font-semibold text-heading">
                            {t(meta.label)}{" "}
                            <span className="font-medium text-muted">
                              {isExchange && tx.exchange_currency
                                ? `${sc} → ${tx.exchange_currency}`
                                : tx.gateway_currency
                                ? `${t("dashboard.transaction.via")} ${tx.gateway_currency}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* status */}
                    <td className={`${dsx.td} hidden whitespace-nowrap sm:table-cell`}>
                      <StatusBadge tone={statusTone(tx.string_status)}>
                        {tx.string_status ?? "—"}
                      </StatusBadge>
                    </td>
                    {/* trx id */}
                    <td className={`${dsx.td} hidden whitespace-nowrap font-mono text-sm text-muted md:table-cell`}>
                      {tx.trx_id}
                    </td>
                    {/* exchange rate */}
                    <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-body lg:table-cell`}>
                      1 {sc} = {tx.exchange_rate} {target}
                    </td>
                    {/* fees */}
                    <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-body lg:table-cell`}>
                      {fmtAmt(tx.fee)} {feeCur}
                    </td>
                    {/* amount */}
                    <td className={`${dsx.td} text-right`}>
                      <div className="whitespace-nowrap text-sm font-bold tabular-nums text-primary">
                        {fmtAmt(tx.sender_request_amount)} {sc}
                      </div>
                      <div className="mt-0.5 whitespace-nowrap text-xs tabular-nums text-muted">
                        {t("dashboard.transaction.payable")}: {fmtAmt(tx.total_payable)} {target}
                      </div>
                    </td>
                    {/* date */}
                    <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-muted md:table-cell`}>
                      {fmtDate(tx.created_at)}
                    </td>
                  </tr>
                );
              })}
              {/* appended skeleton rows while the next page loads */}
              {isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => <TxRowSkeleton key={`sk-${i}`} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* infinite-scroll sentinel + loader + summary */}
      {rows.length > 0 && (
        <>
          {/* sentinel: entering the viewport loads the next page */}
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3.5 sm:px-6 sm:py-4">
            <span className="text-sm text-muted">
              {t("dashboard.common.showing")}{" "}
              <b className="font-semibold text-heading">{filtering ? filtered.length : rows.length}</b>{" "}
              {t("dashboard.common.of")} {total} {t("dashboard.transaction.unit")}
            </span>
            {!hasNextPage ? (
              <span className="text-sm text-muted">{t("dashboard.common.allLoaded")}</span>
            ) : !isFetchingNextPage ? (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                className="cursor-pointer text-sm font-semibold text-primary transition hover:underline"
              >
                {t("dashboard.common.loadMore")}
              </button>
            ) : null}
          </div>
        </>
      )}
    </Panel>
  );
}
