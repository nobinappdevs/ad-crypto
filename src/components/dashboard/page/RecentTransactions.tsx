"use client";

import { Fragment, useState } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { coinBrand } from "@/config/media";
import type { DashboardTransaction } from "@/services/dashboard.service";
import {
  TX_DIRECTION,
  TX_STATUS_CLASS,
  coinAmount,
  txCoin,
  txDateTime,
  txDetails,
  txMethod,
  txNetwork,
  txStatusKey,
  txTypeKey,
  type TxDetail,
} from "@/config/txlog";

/**
 * The account's activity, from `GET /user/dashboard` and `GET /user/transaction/logs`.
 *
 * The columns are the fields every row has — type, coin, network, method, amount,
 * charge, payable, when, reference, status. Everything BEYOND that is per type and
 * lives in `details.data`: a sell paid out to a bank carries a branch, an account
 * number, the sender's own reference and a payment screenshot; an exchange carries
 * two wallets and the rate it converted at. None of that fits a shared column, so
 * a row expands into it — the same fields the order's detail page lists, without
 * leaving the table or widening it into something unreadable.
 *
 * Still absent, and deliberately: a per-unit price and an "executed by" person.
 * Neither exists in the response, and a made-up price on a real ledger row is a
 * wrong number rather than a placeholder.
 *
 * There is no totals row for the same class of reason. Amounts are denominated in
 * each row's OWN coin, so summing 0.06 BTC with 52 ETH produces a figure that
 * means nothing.
 */

const TH = "px-4 py-3 text-start text-[12px]! font-semibold! text-muted";
const TH_NUM = "px-4 py-3 text-end text-[12px]! font-semibold! text-muted";
const TD_NUM = "border-b-0 px-4 py-4 text-end text-[13.5px]! tabular-nums";

/** Type, asset, network, method, 3 numbers, date, status, and the expander. */
const COLUMN_COUNT = 10;

/** Direction decides the icon and its tint, so a row is scannable before it is read. */
const DIRECTION_META = {
  in: { Icon: ArrowDownLeft, tone: "bg-hero-mint/12 text-hero-mint" },
  out: { Icon: ArrowUpRight, tone: "bg-hero-neg/12 text-hero-neg" },
  neutral: { Icon: ArrowLeftRight, tone: "bg-primary/12 text-primary" },
} as const;

export function RecentTransactions({ rows }: { rows: DashboardTransaction[] }) {
  const { t, lang } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  // Which rows are expanded. A set rather than one id: comparing two orders means
  // having both open, and collapsing the first one to read the second is busywork.
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  /**
   * A detail label. `t` falls back to the key path itself when a string is
   * missing, which is right for a fixed UI string but wrong here — the payload's
   * keys are open-ended, so an untranslated one shows its humanised key instead
   * of "dashboard.txDetail.foo".
   */
  const detailLabel = (detail: TxDetail) => {
    const path = `txDetail.${detail.key}`;
    const translated = k(path);
    return translated === `dashboard.${path}` ? detail.label : translated;
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span
          aria-hidden
          className="grid! h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
        >
          <Inbox size={20} />
        </span>
        <p className="mt-4 text-[14px]! font-bold!">{k("table.emptyTitle")}</p>
        <p className="mt-1 max-w-80 text-[12.5px]! leading-relaxed! text-muted">
          {k("table.emptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* min-w keeps the columns honest; below that the panel scrolls sideways
          instead of crushing the table. */}
      <table className="min-w-300">
        <thead>
          <tr className="border-b border-border bg-transparent">
            <th className={cn(TH, "pl-5")}>{k("table.type")}</th>
            <th className={TH}>{k("table.asset")}</th>
            <th className={TH}>{k("table.network")}</th>
            <th className={TH}>{k("table.method")}</th>
            <th className={TH_NUM}>{k("table.amount")}</th>
            <th className={TH_NUM}>{k("table.charge")}</th>
            <th className={TH_NUM}>{k("table.payable")}</th>
            <th className={TH}>
              <span className="inline-flex! items-center gap-1">
                {k("table.date")}
                <ArrowDown size={12} aria-hidden />
              </span>
            </th>
            <th className={TH}>{k("table.status")}</th>
            <th className={cn(TH_NUM, "pr-5")}>
              <span className="sr-only">{k("table.details")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const typeKey = txTypeKey(row.type);
            const direction = typeKey ? TX_DIRECTION[typeKey] : "neutral";
            const { Icon, tone } = DIRECTION_META[direction];
            const coin = txCoin(row);
            const brand = coinBrand(coin.code);
            const statusKey = txStatusKey(row.status);
            const { date, time } = txDateTime(row.created_at, lang);
            const network = txNetwork(row);
            const { method, wallet } = txMethod(row);
            const details = txDetails(row);

            // `trx_id` is the natural key, but a row without one still has to
            // render — the index keeps React happy without dropping it.
            const id = String(row.trx_id || row.id || i);
            const expanded = open.has(id);

            return (
              <Fragment key={id}>
                <tr
                  className={cn(
                    "border-b border-border transition-colors",
                    expanded ? "bg-black/2 dark:bg-white/3" : "hover:bg-black/2 dark:hover:bg-white/3",
                  )}
                >
                  <td className="border-b-0 px-4 py-4 pl-5">
                    <span className="inline-flex! items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cn("grid! h-8 w-8 shrink-0 place-items-center rounded-lg", tone)}
                      >
                        <Icon size={15} />
                      </span>
                      {/* The server's own wording when the type is one we don't map,
                          rather than forcing it into the nearest known bucket. */}
                      <span className="text-[13.5px]! font-semibold!">
                        {typeKey ? k(`txType.${typeKey}`) : row.type || "—"}
                      </span>
                    </span>
                  </td>

                  <td className="border-b-0 px-4 py-4">
                    {coin.code ? (
                      <span className="inline-flex! items-center gap-2.5">
                        <CoinBadge color={brand.color} glyph={brand.glyph} size={28} />
                        <span className="min-w-0">
                          <span className="block text-[13.5px]! font-bold!">{coin.code}</span>
                          {coin.name && (
                            <span className="block text-[12px]! text-muted">{coin.name}</span>
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[13px]! text-muted">—</span>
                    )}
                  </td>

                  <td className="border-b-0 px-4 py-4 text-[13px]!">
                    {network || <span className="text-muted">—</span>}
                  </td>

                  <td className="border-b-0 px-4 py-4">
                    <div className="text-[13px]!">{method || "—"}</div>
                    {/* Which side the coins came from is what separates two
                        otherwise identical sells. */}
                    {wallet && <div className="text-[12px]! text-muted">{wallet}</div>}
                  </td>

                  <td className={cn(TD_NUM, "font-semibold!")}>{coinAmount(row.amount)}</td>
                  <td className={cn(TD_NUM, "text-muted")}>{coinAmount(row.total_charge)}</td>
                  <td className={TD_NUM}>{coinAmount(row.total_payable)}</td>

                  <td className="border-b-0 px-4 py-4">
                    <div className="text-[13px]!">{date || "—"}</div>
                    <div className="text-[12px]! tabular-nums text-muted">
                      {[time, row.trx_id].filter(Boolean).join(" · ")}
                    </div>
                  </td>

                  <td className="border-b-0 px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex! items-center gap-1.5 text-[12.5px]! font-semibold!",
                        TX_STATUS_CLASS[statusKey],
                      )}
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                      {k(`txStatus.${statusKey}`)}
                    </span>
                    {/* A rejection without its reason leaves the user with nothing to
                        act on, and the field is only ever set on that path. */}
                    {row.reject_reason && (
                      <p className="mt-1 max-w-50 text-[11.5px]! leading-snug! text-muted">
                        {row.reject_reason}
                      </p>
                    )}
                  </td>

                  <td className="border-b-0 px-4 py-4 pr-5 text-end">
                    {/* No expander on a row with nothing behind it — a button that
                        opens an empty panel is worse than no button. */}
                    {details.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        aria-expanded={expanded}
                        aria-label={k(expanded ? "table.hideDetails" : "table.showDetails")}
                        title={k(expanded ? "table.hideDetails" : "table.showDetails")}
                        className="inline-grid h-8 w-8 cursor-pointer place-items-center rounded-lg border border-border text-muted transition hover:border-primary hover:text-primary"
                      >
                        <ChevronDown
                          size={15}
                          aria-hidden
                          className={cn("transition-transform", expanded && "rotate-180")}
                        />
                      </button>
                    )}
                  </td>
                </tr>

                {expanded && (
                  <tr className="border-b border-border bg-surface">
                    <td colSpan={COLUMN_COUNT} className="border-b-0 px-4 py-4 pl-5 sm:px-5">
                      <p className="text-[12px]! font-semibold! text-muted">
                        {k("table.details")}
                      </p>

                      {/* Two columns of label/value pairs rather than the table's
                          own grid: these fields differ per row, so aligning them
                          across rows would only line up coincidences. */}
                      <dl className="mt-2.5 grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
                        {details.map((detail) => (
                          <div
                            key={detail.key}
                            className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-b-0"
                          >
                            <dt className="shrink-0 text-[12.5px]! text-muted">
                              {detailLabel(detail)}
                            </dt>
                            <dd className="min-w-0 text-end text-[12.5px]! font-semibold! wrap-break-word">
                              {detail.href ? (
                                <a
                                  href={detail.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex! items-center gap-1 text-primary hover:underline"
                                >
                                  {k("table.open")}
                                  <ExternalLink size={12} aria-hidden />
                                </a>
                              ) : (
                                detail.value
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
