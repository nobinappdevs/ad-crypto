"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal, MessageSquareText, ShieldCheck, HandCoins, ShoppingBag, Store, QrCode } from "lucide-react";
import { Panel, PanelHeader, dsx } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLang } from "@/hooks/useLang";
import { useEscrowIndex } from "@/hooks/useEscrow";
import { useDashboard } from "@/hooks/useDashboard";

/* Same visual language as the shared StatusBadge: soft tint + border (+ dot for status). */
const NEUTRAL_BADGE = "border border-border bg-black/[0.03] text-muted dark:bg-white/[0.05]";

/* Role indicator — icon avatar + text, matching the Counterparty column's look. */
const ROLE_META: Record<string, { Icon: typeof ShoppingBag; iconBg: string; text: string }> = {
  buyer: { Icon: ShoppingBag, iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", text: "text-indigo-600 dark:text-indigo-400" },
  seller: { Icon: Store, iconBg: "bg-primary/10 text-primary", text: "text-primary" },
};

const initials = (s: string) =>
  (s || "").replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "—";

/* Escrow status enum (backend) → label + a distinct badge colour each. */
const STATUS_MAP: Record<number, { label: string; box: string; dot: string }> = {
  1: {
    label: "dashboard.escrowStatus.ongoing",
    box: "border border-blue-500/20 bg-blue-500/[0.03] text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  2: {
    label: "dashboard.escrowStatus.paymentPending",
    box: "border border-amber-500/20 bg-amber-500/[0.03] text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  3: {
    label: "dashboard.escrowStatus.approvalPending",
    box: "border border-yellow-500/20 bg-yellow-500/[0.03] text-yellow-600 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-300",
    dot: "bg-yellow-500",
  },
  4: {
    label: "dashboard.escrowStatus.released",
    box: "border border-emerald-500/20 bg-emerald-500/[0.03] text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  5: {
    label: "dashboard.escrowStatus.activeDispute",
    box: "border border-orange-500/20 bg-orange-500/[0.03] text-orange-600 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  6: {
    label: "dashboard.escrowStatus.disputed",
    box: "border border-rose-500/20 bg-rose-500/[0.03] text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  7: {
    label: "dashboard.escrowStatus.canceled",
    box: "border border-slate-500/20 bg-slate-500/[0.03] text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300",
    dot: "bg-slate-500",
  },
  8: {
    label: "dashboard.escrowStatus.refunded",
    box: "border border-violet-500/20 bg-violet-500/[0.03] text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  9: {
    label: "dashboard.escrowStatus.paymentWaiting",
    box: "border border-fuchsia-500/20 bg-fuchsia-500/[0.03] text-fuchsia-600 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
};

/* Normalize an escrow row from the API into what the table needs. */
function normalize(e: any) {
  const amountStr = String(e.amount ?? e.total_amount ?? "");
  const amountHasCurrency = /[a-zA-Z]/.test(amountStr); // e.g. "77.00 USD"
  const st = STATUS_MAP[Number(e.status)] ?? { label: e.status_string ?? "dashboard.escrowStatus.pending", box: NEUTRAL_BADGE, dot: "bg-muted" };
  return {
    id: e.escrow_id ?? e.trx ?? e.id ?? "",
    rowId: e.id,                 // numeric DB id — used by the pay/action page
    userId: e.user_id,
    buyerOrSellerId: e.buyer_or_seller_id,       // the party expected to pay/approve
    oppositeRole: (e.opposite_role ?? "").toString().toLowerCase(),
    conversations: Array.isArray(e.conversations) ? e.conversations : [],
    statusNum: Number(e.status),
    title: e.title ?? "—",
    party: e.counter_part ?? e.counterparty ?? e.category ?? "—",
    role: (e.role ?? e.my_role ?? "").toString(),
    amount: amountStr,
    currency: amountHasCurrency ? "" : (e.escrow_currency ?? e.currency_code ?? ""),
    date: e.created_at ? String(e.created_at).slice(0, 10) : (e.date ?? ""),
    statusLabel: st.label,
    statusBox: st.box,
    statusDot: st.dot,
  };
}

/* single row skeleton — for initial load + "load more" (client infinite scroll) */
function EscrowRowSkeleton() {
  return (
    <tr className="border-b border-border last:border-0">
      <td className={dsx.td} colSpan={7}>
        <div className="h-9 w-full animate-pulse rounded-lg bg-border" />
      </td>
    </tr>
  );
}

const PAGE_SIZE = 10;

/* ───────────────────────── view ───────────────────────── */

export function MyEscrow() {
  const { t } = useLang();
  const { data: res, isLoading } = useEscrowIndex();
  const { data: dashRes } = useDashboard();
  const myId = (dashRes as any)?.data?.user_id ?? (dashRes as any)?.data?.user?.user?.id;

  const raw = (res as any)?.data;
  const rawList: any[] = Array.isArray(raw)
    ? raw
    : raw?.escrow_data ?? raw?.escrows ?? raw?.escrow ?? raw?.myEscrow ?? raw?.data ?? [];
  const escrows = rawList.map(normalize);

  // Frontend pagination (the API returns everything at once) — show 10, then load
  // 10 more as the sentinel nears the viewport, with a brief skeleton.
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const shown = escrows.slice(0, visible);
  const hasMore = visible < escrows.length;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false); // guards against double-trigger without re-running the effect

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        setLoadingMore(true);
        setTimeout(() => {
          setVisible((v) => v + PAGE_SIZE);
          setLoadingMore(false);
          loadingRef.current = false;
        }, 400);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  return (
    <Panel>
      <PanelHeader title={t("dashboard.myEscrow.title")} badge={escrows.length}>
        <div className="relative w-full sm:flex-1 lg:w-56 lg:flex-none">
          <Input
            type="text"
            leftIcon={<Search size={16} strokeWidth={2} aria-hidden />}
            placeholder={t("dashboard.myEscrow.searchPlaceholder")}
          />
        </div>
        {/* below sm the search takes its own line, so these two split the next one */}
        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" leftIcon={<SlidersHorizontal size={16} strokeWidth={2} aria-hidden />}>
          {t("dashboard.myEscrow.filter")}
        </Button>
        <Link href="/dashboard/create-escrow" className={`${dsx.btnPrimary} flex-1 sm:flex-none`}>
          <Plus size={16} strokeWidth={2.5} aria-hidden />
          <span className="hidden sm:inline text-white">{t("dashboard.myEscrow.newEscrow")}</span>
          <span className="text-white sm:hidden">{t("dashboard.myEscrow.new")}</span>
        </Link>
      </PanelHeader>

      <div className="scroll-x">
        <table className="dash-table w-full min-w-210 border-collapse text-left">
          <thead>
            <tr className="border-b-0">
              <th className={dsx.th}>{t("dashboard.myEscrow.colEscrow")}</th>
              <th className={dsx.th}>{t("dashboard.myEscrow.colCounterparty")}</th>
              <th className={dsx.th}>{t("dashboard.myEscrow.colRole")}</th>
              <th className={`${dsx.th} text-right`}>{t("dashboard.myEscrow.colAmount")}</th>
              <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.myEscrow.colCreated")}</th>
              <th className={dsx.th}>{t("dashboard.myEscrow.colStatus")}</th>
              <th className={`${dsx.th} w-px`} aria-label={t("dashboard.myEscrow.colActions")} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className={dsx.td} colSpan={7}>
                    <div className="h-9 w-full animate-pulse rounded-lg bg-border" />
                  </td>
                </tr>
              ))
            ) : escrows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck size={20} strokeWidth={2} aria-hidden />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.myEscrow.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-muted">{t("dashboard.myEscrow.emptyDesc")}</p>
                </td>
              </tr>
            ) : (
              <>
              {shown.map((e, i) => (
                <tr key={e.id || i} className={dsx.rowHover}>
                  <td className={dsx.td}>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{initials(e.title)}</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-heading">{e.title}</div>
                        <div className="font-mono text-xs text-muted">{e.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className={dsx.td}>
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/5 text-xs font-bold text-muted dark:bg-white/10">{initials(e.party)}</div>
                      <span className="whitespace-nowrap text-sm text-body">{e.party}</span>
                    </div>
                  </td>
                  <td className={dsx.td}>
                    {(() => {
                      const meta = ROLE_META[e.role.toLowerCase()];
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${meta?.iconBg ?? "bg-black/5 text-muted dark:bg-white/10"}`}>
                            {meta ? <meta.Icon size={13} strokeWidth={2.5} aria-hidden /> : null}
                          </span>
                          <span className={`whitespace-nowrap text-sm font-semibold capitalize ${meta?.text ?? "text-muted"}`}>{e.role || "—"}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className={`${dsx.td} text-right`}>
                    <span className="whitespace-nowrap text-sm font-bold tabular-nums text-heading">
                      {e.amount} <small className="text-xs font-medium text-muted">{e.currency}</small>
                    </span>
                  </td>
                  <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-muted md:table-cell`}>{e.date}</td>
                  <td className={dsx.td}>
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${e.statusBox}`}>
                      <i className={`h-1.5 w-1.5 rounded-full ${e.statusDot}`} />
                      {t(e.statusLabel)}
                    </span>
                  </td>
                  <td className={`${dsx.td} w-px`}>
                    {(() => {
                      // Who must act on an Approval-Pending escrow: the `buyer_or_seller_id`
                      // party (falls back to "I'm the buyer" when that field is absent).
                      const iAmActor = e.buyerOrSellerId != null
                        ? String(e.buyerOrSellerId) === String(myId)
                        : e.role.toLowerCase() === "buyer";
                      const showApproval = e.statusNum === 3 && iAmActor;
                      // Payment-Waiting (status 9) → crypto address button, shown to the
                      // BUYER (the party who pays), matching the list's "My Role" column.
                      // Owner uses the my-escrow route, the counterparty the escrow-action route.
                      const showCrypto = e.statusNum === 9 && e.role.toLowerCase() === "buyer";
                      const cryptoMode = String(e.userId) === String(myId) ? "my" : "action";
                      const unseen = e.conversations.filter(
                        (c: any) => String(c.seen) === "0" && String(c.sender) !== String(myId),
                      ).length;
                      return (
                        <div className="flex items-center justify-end gap-2">
                          {showApproval && (
                            <Link
                              href={`/dashboard/escrow/pay?id=${e.rowId}`}
                              aria-label={t("dashboard.myEscrow.pay")}
                              className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-white shadow-sm shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/40 active:translate-y-0"
                            >
                              <HandCoins size={16} strokeWidth={2} aria-hidden className="transition-transform group-hover:scale-110" />
                            </Link>
                          )}
                          {showCrypto && (
                            <Link
                              href={`/dashboard/escrow/crypto-address?id=${e.id}&mode=${cryptoMode}`}
                              aria-label={t("dashboard.createEscrow.cryptoAddressTitle")}
                              className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-500/70 text-white shadow-sm shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-500/40 active:translate-y-0"
                            >
                              <QrCode size={16} strokeWidth={2} aria-hidden className="transition-transform group-hover:scale-110" />
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/escrow/conversation?id=${e.rowId}`}
                            aria-label={`${t("dashboard.myEscrow.openConversation")} ${e.title}`}
                            className="relative inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary"
                          >
                            <MessageSquareText size={16} strokeWidth={2} aria-hidden />
                            <span className="hidden sm:inline">{t("dashboard.myEscrow.chat")}</span>
                            {unseen > 0 && (
                              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                {unseen}
                              </span>
                            )}
                          </Link>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {loadingMore && Array.from({ length: 3 }).map((_, i) => <EscrowRowSkeleton key={`sk-${i}`} />)}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* sentinel — entering the viewport loads the next 10 */}
      {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
    </Panel>
  );
}
