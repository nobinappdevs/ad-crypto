"use client";

import Link from "next/link";
import { Plus, Search, Inbox, MessageSquareText } from "lucide-react";
import { Panel, PanelHeader, StatusBadge, TableFooter, dsx } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { useLang } from "@/hooks/useLang";

/* ───────────────────────── data ───────────────────────── */

const TICKETS = [
  { id: "TKT-100294", subject: "Withdrawal not received", message: "I requested a money out 3 days ago but the funds have not arrived in my bank yet.", status: "pending", statusLabel: "Open",     reply: "2 hours ago" },
  { id: "TKT-100288", subject: "KYC verification stuck",  message: "My documents were uploaded but the status still shows pending review.",            status: "info",    statusLabel: "Answered", reply: "1 day ago"   },
  { id: "TKT-100271", subject: "Escrow release delay",    message: "The seller confirmed delivery but the funds were not released to my wallet.",       status: "success", statusLabel: "Closed",   reply: "5 days ago"  },
];

/* ───────────────────────── view ───────────────────────── */

export function Support() {
  const { t } = useLang();

  return (
    <Panel>
      <PanelHeader title={t("dashboard.support.title")} badge={TICKETS.length}>
        <div className="w-full sm:flex-1 lg:w-56 lg:flex-none">
          <Input
            type="text"
            leftIcon={<Search size={16} strokeWidth={2} aria-hidden />}
            placeholder={t("dashboard.support.colSubject")}
          />
        </div>
        <Link href="/dashboard/support/new" className={dsx.btnPrimary}>
          <Plus size={16} strokeWidth={2.5} aria-hidden />
          <span className="text-white ">{t("dashboard.support.addNew")}</span>
        </Link>
      </PanelHeader>

      <div className="scroll-x">
        <table className="dash-table w-full min-w-210 border-collapse text-left">
          <thead>
            <tr>
              <th className={dsx.th}>{t("dashboard.support.colTicketId")}</th>
              <th className={dsx.th}>{t("dashboard.support.colSubject")}</th>
              <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.support.colMessage")}</th>
              <th className={dsx.th}>{t("dashboard.support.colStatus")}</th>
              <th className={dsx.th}>{t("dashboard.support.colLastReply")}</th>
              <th className={`${dsx.th} w-px`} aria-label={t("dashboard.support.colMessage")} />
            </tr>
          </thead>
          <tbody>
            {TICKETS.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-indigo-500/15 bg-indigo-500/5 py-10 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Inbox size={22} strokeWidth={2} aria-hidden />
                    </span>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{t("dashboard.support.noData")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              TICKETS.map((tk) => (
                <tr key={tk.id} className={`group ${dsx.rowHover}`}>
                  <td className={dsx.td}>
                    <span className="font-mono text-xs font-semibold text-primary">{tk.id}</span>
                  </td>
                  <td className={dsx.td}>
                    <span className="text-sm font-semibold text-heading">{tk.subject}</span>
                  </td>
                  <td className={`${dsx.td} hidden max-w-xs md:table-cell`}>
                    <span className="block truncate text-sm text-muted">{tk.message}</span>
                  </td>
                  <td className={dsx.td}>
                    <StatusBadge tone={tk.status}>{tk.statusLabel}</StatusBadge>
                  </td>
                  <td className={`${dsx.td} whitespace-nowrap text-sm text-muted`}>{tk.reply}</td>
                  <td className={`${dsx.td} w-px`}>
                    <Link
                      href={`/dashboard/support/new?id=${tk.id}`}
                      aria-label={tk.subject}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-muted transition hover:border-primary/40 hover:text-primary"
                    >
                      <MessageSquareText size={16} strokeWidth={2} aria-hidden />
                      <span className="hidden sm:inline">{t("dashboard.support.colMessage")}</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {TICKETS.length > 0 && <TableFooter shown={TICKETS.length} total={TICKETS.length} />}
    </Panel>
  );
}
