"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
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
  txChargeSplit,
  txCoin,
  txDateTime,
  txHasDetails,
  txStatusKey,
  txTarget,
  txTypeKey,
  txWillGet,
  type TxStatusKey,
} from "@/config/txlog";
import { TransactionModal } from "./TransactionModal";

/**
 * The account's activity, from `GET /user/dashboard` and `/user/transaction/logs`.
 *
 * The columns are the fields every row of the log carries — the type and its
 * reference, both sides of the trade, the arithmetic (amount, the charge and the
 * split behind it, what was payable, what it returns), the balance left, when, and
 * where it got to. Everything past that is per type (a gateway's answer, a manual
 * payment's form, an exchange rate) and opens in `TransactionModal`.
 *
 * Network and method used to have columns of their own; on most rows the API sends
 * neither, so the table carried two empty columns to serve a minority of rows. They
 * are in the sheet's summary strip instead, where an absence costs nothing.
 *
 * No per-unit price and no totals row: neither exists in the response, and amounts
 * are denominated in each row's own coin, so a sum would mean nothing.
 */

const TH = "px-4 py-3 text-start text-[12px]! font-semibold! text-muted";
const TH_NUM = "px-4 py-3 text-end text-[12px]! font-semibold! text-muted";
const TD = "border-b-0 px-4 py-3.5";
const TD_NUM = "border-b-0 px-4 py-3.5 text-end text-[13.5px]! tabular-nums";

/** Direction decides the icon and its tint, so a row is scannable before it is read. */
const DIRECTION_META = {
  in: { Icon: ArrowDownLeft, tone: "bg-hero-mint/12 text-hero-mint" },
  out: { Icon: ArrowUpRight, tone: "bg-hero-neg/12 text-hero-neg" },
  neutral: { Icon: ArrowLeftRight, tone: "bg-primary/12 text-primary" },
} as const;

/** Everything a row displays, read once and shared by the table and the card list. */
function useRowView(row: DashboardTransaction) {
  const { t, lang } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const typeKey = txTypeKey(row.type);
  const coin = txCoin(row);
  const statusKey = txStatusKey(row.status);

  return {
    ...DIRECTION_META[typeKey ? TX_DIRECTION[typeKey] : "neutral"],
    /** The server's own wording when the type is one this build does not map. */
    label: typeKey ? k(`txType.${typeKey}`) : row.type || "—",
    coin,
    brand: coinBrand(coin.code || coin.name),
    statusKey,
    statusLabel: k(`txStatus.${statusKey}`),
    target: txTarget(row),
    split: txChargeSplit(row),
    willGet: txWillGet(row),
    ...txDateTime(row.created_at, lang),
    hasDetails: txHasDetails(row),
  };
}

export function RecentTransactions({ rows }: { rows: DashboardTransaction[] }) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  /** The row whose sheet is open, or null. The ROW, not its id — the modal reads it. */
  const [active, setActive] = useState<DashboardTransaction | null>(null);

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

  // `trx_id` is the natural key, but a row without one still has to render — the
  // index keeps React happy without dropping it.
  const keyOf = (row: DashboardTransaction, i: number) => String(row.trx_id || row.id || i);

  return (
    <>
      {/* The full ledger is wider than a tablet, so it starts at `md` and scrolls
          sideways under that width — below `md` the same rows are cards instead. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-315">
          <thead>
            <tr className="border-b border-border bg-transparent">
              <th className={cn(TH, "ps-5")}>{k("table.transaction")}</th>
              <th className={TH}>{k("table.asset")}</th>
              <th className={TH}>{k("table.to")}</th>
              <th className={TH_NUM}>{k("table.amount")}</th>
              <th className={TH_NUM}>{k("table.charge")}</th>
              <th className={TH_NUM}>{k("table.payable")}</th>
              <th className={TH_NUM}>{k("table.balanceAfter")}</th>
              <th className={TH}>
                <span className="inline-flex! items-center gap-1">
                  {k("table.date")}
                  <ArrowDown size={12} aria-hidden />
                </span>
              </th>
              <th className={cn(TH, "pe-5 text-end")}>{k("table.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Row
                key={keyOf(row, i)}
                row={row}
                isActive={active === row}
                onOpen={() => setActive(row)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {rows.map((row, i) => (
          <TxCard
            key={keyOf(row, i)}
            row={row}
            isActive={active === row}
            onOpen={() => setActive(row)}
          />
        ))}
      </ul>

      {/* One modal for the whole ledger, driven by which row is active — not one per
          row, which would mount a dialog for every line. */}
      <TransactionModal tx={active} onClose={() => setActive(null)} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* One row                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The whole row opens the sheet, since that is what a reader aims at, and the type
 * is a real button so the keyboard has a way in.
 *
 * No chevron column: it was a piece of furniture repeated on every line to say what
 * the cursor and the hover already say, and it cost the table a column.
 */
function Row({
  row,
  isActive,
  onOpen,
}: {
  row: DashboardTransaction;
  isActive: boolean;
  onOpen: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);
  const view = useRowView(row);

  return (
    <tr
      onClick={view.hasDetails ? onOpen : undefined}
      className={cn(
        "group border-b border-border transition-colors last:border-b-0",
        view.hasDetails && "cursor-pointer",
        isActive ? "bg-primary/6" : "hover:bg-black/2 dark:hover:bg-white/3",
      )}
    >
      <td className={cn(TD, "ps-5")}>
        <span className="inline-flex! items-center gap-2.5">
          <span
            aria-hidden
            className={cn("grid! h-9 w-9 shrink-0 place-items-center rounded-xl", view.tone)}
          >
            <view.Icon size={16} />
          </span>
          <span className="min-w-0">
            {view.hasDetails ? (
              <button
                type="button"
                onClick={onOpen}
                aria-label={k("table.showDetails")}
                className="block cursor-pointer text-[13.5px]! font-bold! transition-colors group-hover:text-primary"
              >
                {view.label}
              </button>
            ) : (
              <span className="block text-[13.5px]! font-bold!">{view.label}</span>
            )}
            {/* The reference is what a reader quotes to support, so it belongs on
                the row and not only inside the sheet. */}
            <span className="block text-[11.5px]! tabular-nums text-muted">
              {row.trx_id || "—"}
            </span>
          </span>
        </span>
      </td>

      <td className={TD}>
        {/* A row whose payload never names a ticker still names the coin — the code
            line falls back to the name, and the name line then has nothing to add. */}
        {view.coin.code || view.coin.name ? (
          <span className="inline-flex! items-center gap-2.5">
            <CoinBadge color={view.brand.color} glyph={view.brand.glyph} size={28} />
            <span className="min-w-0">
              <span className="block text-[13.5px]! font-bold!">
                {view.coin.code || view.coin.name}
              </span>
              {view.coin.code && view.coin.name && (
                <span className="block text-[11.5px]! text-muted">{view.coin.name}</span>
              )}
            </span>
          </span>
        ) : (
          <span className="text-[13px]! text-muted">—</span>
        )}
      </td>

      {/* The other side of the trade: the coin received and the address it went to,
          or the rail a purchase paid through. The asset column has the sending side,
          so between them a row reads ETH → BTC without opening anything. */}
      <td className={TD}>
        {view.target.title ? (
          <>
            <div className="flex items-center gap-1.5 text-[13px]!">
              <ArrowRight size={12} aria-hidden className="shrink-0 text-muted rtl:rotate-180" />
              <span className="truncate font-semibold!">{view.target.title}</span>
            </div>
            {view.target.sub && (
              <div className="mt-0.5 ps-4.5 text-[11.5px]! tabular-nums text-muted">
                {view.target.sub}
              </div>
            )}
          </>
        ) : (
          <span className="text-[13px]! text-muted">—</span>
        )}
      </td>

      {/* The coin rides the amount, not the charge and payable: those are in the
          same unit, and repeating the code three times only crowds the figures. */}
      <td className={cn(TD_NUM, "font-bold!")}>
        {coinAmount(row.amount)}
        {view.coin.code && (
          <span className="ms-1 text-[11.5px]! font-semibold! text-muted">{view.coin.code}</span>
        )}
      </td>

      <td className={TD_NUM}>
        <div className="text-muted">{coinAmount(row.total_charge)}</div>
        {/* A total charge always raises the question of how it was arrived at, and
            both halves are on the row. */}
        {view.split && <div className="text-[11px]! text-muted/75">{view.split}</div>}
      </td>

      <td className={TD_NUM}>
        <div className="font-semibold!">{coinAmount(row.total_payable)}</div>
        {view.willGet && (
          <div className="text-[11px]! text-hero-mint">→ {view.willGet}</div>
        )}
      </td>

      <td className={cn(TD_NUM, "text-muted")}>{coinAmount(row.available_balance)}</td>

      <td className={TD}>
        <div className="text-[13px]!">{view.date || "—"}</div>
        <div className="text-[11.5px]! tabular-nums text-muted">{view.time}</div>
      </td>

      <td className={cn(TD, "pe-5 text-end")}>
        <StatusPill statusKey={view.statusKey} label={view.statusLabel} />
        {/* A rejection without its reason leaves the user with nothing to act on,
            and the field is only ever set on that path. */}
        {row.reject_reason && (
          <p className="mt-1 ms-auto max-w-50 text-[11.5px]! leading-snug! text-muted">
            {row.reject_reason}
          </p>
        )}
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* One row, on a phone                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The same seven fields, stacked: what and when on the left, the figure and where it
 * got to on the right, with the charge and the payable under them.
 */
function TxCard({
  row,
  isActive,
  onOpen,
}: {
  row: DashboardTransaction;
  isActive: boolean;
  onOpen: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);
  const view = useRowView(row);

  return (
    <li>
      <button
        type="button"
        onClick={view.hasDetails ? onOpen : undefined}
        aria-label={view.hasDetails ? k("table.showDetails") : undefined}
        className={cn(
          "block w-full px-4 py-3.5 text-start transition-colors",
          view.hasDetails ? "cursor-pointer" : "cursor-default",
          isActive ? "bg-primary/6" : "hover:bg-black/2 dark:hover:bg-white/3",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn("grid! h-9 w-9 shrink-0 place-items-center rounded-xl", view.tone)}
          >
            <view.Icon size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13.5px]! font-bold!">{view.label}</span>
              {view.coin.code && (
                <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[11px]! font-bold! text-muted">
                  {view.coin.code}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11.5px]! tabular-nums text-muted">
              {[view.date, view.time, row.trx_id].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="shrink-0 text-end">
            <div className="text-[14px]! font-bold! tabular-nums">{coinAmount(row.amount)}</div>
            <div className="mt-1">
              <StatusPill statusKey={view.statusKey} label={view.statusLabel} />
            </div>
          </div>
        </div>

        {/* Where it went, then the figures that qualify the amount — kept off the
            headline line so the headline stays readable at a glance. */}
        <div className="mt-2 ps-12">
          {view.target.title && (
            <p className="flex items-center gap-1.5 text-[12px]!">
              <ArrowRight size={12} aria-hidden className="shrink-0 text-muted rtl:rotate-180" />
              <span className="truncate font-semibold!">{view.target.title}</span>
              {view.target.sub && (
                <span className="truncate tabular-nums text-muted">{view.target.sub}</span>
              )}
            </p>
          )}

          <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px]! tabular-nums">
            <Fact label={k("table.charge")} value={coinAmount(row.total_charge)} hint={view.split} />
            <Fact label={k("table.payable")} value={coinAmount(row.total_payable)} />
            {view.willGet && (
              <Fact label={k("table.willGet")} value={view.willGet} tone="text-hero-mint" />
            )}
            <Fact label={k("table.balanceAfter")} value={coinAmount(row.available_balance)} />
          </dl>
        </div>

        {row.reject_reason && (
          <p className="mt-2 ms-12 text-[11.5px]! leading-snug! text-hero-neg">
            {row.reject_reason}
          </p>
        )}
      </button>
    </li>
  );
}

/** One label/value pair of a card's figures — the phone's version of a column. */
function Fact({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={cn("min-w-0 truncate font-semibold!", tone ?? "text-heading")}>
        {value}
        {hint && <span className="ms-1 font-normal! text-muted/75">({hint})</span>}
      </dd>
    </div>
  );
}

/**
 * Status as a tinted pill — a dot as well as the word, never colour alone. It is the
 * one field a reader scans a ledger for, so it reads the same in both layouts.
 */
function StatusPill({ statusKey, label }: { statusKey: TxStatusKey; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex! items-center gap-1.5 rounded-full border border-current/18 bg-current/8 px-2.5 py-1 text-[11.5px]! font-semibold!",
        TX_STATUS_CLASS[statusKey],
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
