"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowDown, Check, Minus } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { price, usd } from "@/config/market";
import { txAmount, txFee, type Transaction } from "@/config/transactions";

/**
 * The transaction ledger, as a table. Shared with the Transactions page, which
 * shows the same columns over the full history.
 *
 * Totals are summed from the ROWS PASSED IN — a footer totalling ten under four
 * visible lines is simply wrong.
 */

/** Shared cell classes — numeric columns are end-aligned and tabular so the
    figures line up down the column and against the totals row. */
const TH = "px-4 py-3 text-start text-[12px]! font-semibold! text-muted";
const TH_NUM = "px-4 py-3 text-end text-[12px]! font-semibold! text-muted";
const TD_NUM = "border-b-0 px-4 py-4 text-end text-[13.5px]! tabular-nums";

/** Status text colours ride the theme tokens where one exists. */
const STATUS_CLASS: Record<string, string> = {
  processing: "text-amber-600 dark:text-amber-400",
  success: "text-hero-mint",
  declined: "text-hero-neg",
};

/** Quantities span 0.08 BTC to 12,000 DOGE, so the precision has to follow suit. */
const qty = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 8 });

function CheckBox({
  state,
  onClick,
  label,
}: {
  state: "on" | "off" | "mixed";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "mixed" ? "mixed" : state === "on"}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-4.5 w-4.5 cursor-pointer place-items-center rounded-[5px]-PLACEHOLDER border transition-colors",
        state === "off"
          ? "border-border bg-transparent hover:border-primary"
          : "border-primary bg-primary text-white",
      )}
    >
      {state === "on" && <Check size={12} strokeWidth={3} />}
      {state === "mixed" && <Minus size={12} strokeWidth={3} />}
    </button>
  );
}

export function TransactionsTable({
  rows,
  initialChecked = [],
}: {
  rows: Transaction[];
  /** Row indexes that arrive selected. */
  initialChecked?: number[];
}) {
  const { t } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  const [checked, setChecked] = useState<Set<number>>(() => new Set(initialChecked));

  const toggleRow = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const headState = checked.size === 0 ? "off" : checked.size === rows.length ? "on" : "mixed";

  const totals = useMemo(
    () => ({
      amount: rows.reduce((sum, row) => sum + txAmount(row), 0),
      fee: rows.reduce((sum, row) => sum + txFee(row), 0),
    }),
    [rows],
  );

  return (
    <>
      {/* min-w keeps the columns honest; below that the panel scrolls sideways
          instead of crushing the table. */}
      <div className="overflow-x-auto">
        <table className="min-w-290">
          <thead>
            <tr className="border-b border-border bg-transparent">
              <th className="w-12 py-3 pr-0 pl-5">
                <CheckBox
                  state={headState}
                  label={k("table.selectAll")}
                  onClick={() =>
                    setChecked(headState === "on" ? new Set() : new Set(rows.map((_, i) => i)))
                  }
                />
              </th>
              <th className={TH}>{k("table.productName")}</th>
              <th className={TH}>{k("table.type")}</th>
              <th className={TH_NUM}>{k("table.quantity")}</th>
              <th className={TH_NUM}>{k("table.price")}</th>
              <th className={TH_NUM}>{k("table.orderAmount")}</th>
              <th className={TH_NUM}>{k("table.fee")}</th>
              <th className={TH}>
                <span className="inline-flex! items-center gap-1">
                  {k("table.date")}
                  <ArrowDown size={12} aria-hidden />
                </span>
              </th>
              <th className={TH}>{k("table.status")}</th>
              <th className={TH}>{k("table.executedBy")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.ref}
                className="border-b border-border transition-colors hover:bg-black/2 dark:hover:bg-white/3"
              >
                <td className="w-12 border-b-0 py-4 pr-0 pl-5">
                  <CheckBox
                    state={checked.has(i) ? "on" : "off"}
                    label={row.ticker}
                    onClick={() => toggleRow(i)}
                  />
                </td>
                <td className="border-b-0 px-4 py-4">
                  <div className="text-[13.5px]! font-bold!">{row.ticker}</div>
                  <div className="text-[12px]! text-muted">{row.company}</div>
                </td>
                <td className="border-b-0 px-4 py-4">
                  {/* Direction is the one field a reader scans for, so it gets a
                      word as well as a colour — never colour alone. */}
                  <span
                    className={cn(
                      "inline-flex! items-center rounded-md px-2 py-0.5 text-[11.5px]! font-semibold! uppercase",
                      row.side === "buy"
                        ? "bg-hero-mint/12 text-hero-mint"
                        : "bg-hero-neg/12 text-hero-neg",
                    )}
                  >
                    {k(`tradeSide.${row.side}`)}
                  </span>
                </td>
                <td className={TD_NUM}>{qty(row.quantity)}</td>
                <td className={TD_NUM}>{price(row.price)}</td>
                <td className={cn(TD_NUM, "font-semibold!")}>{usd(txAmount(row))}</td>
                <td className={cn(TD_NUM, "text-muted")}>{usd(txFee(row))}</td>
                <td className="border-b-0 px-4 py-4">
                  <div className="text-[13px]!">{row.date}</div>
                  <div className="text-[12px]! tabular-nums text-muted">
                    {row.time} · {row.ref}
                  </div>
                </td>
                <td className="border-b-0 px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex! items-center gap-1.5 text-[12.5px]! font-semibold!",
                      STATUS_CLASS[row.status],
                    )}
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {k(`status.${row.status}`)}
                  </span>
                </td>
                <td className="border-b-0 px-4 py-4">
                  <span className="inline-flex! items-center gap-2.5">
                    {row.avatar ? (
                      <Image
                        src={row.avatar}
                        alt=""
                        width={700}
                        height={966}
                        className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <span className="grid! h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px]! font-bold! text-primary">
                        {row.initials}
                      </span>
                    )}
                    <span className="text-[13px]! text-muted">{row.email}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface/60">
              <td className="py-3 pr-0 pl-5" />
              <td className="px-4 py-3 text-[12.5px]! font-semibold! text-muted" colSpan={4}>
                {k("table.totalRow")}
              </td>
              <td className={cn(TD_NUM, "py-3 font-bold!")}>{usd(totals.amount)}</td>
              <td className={cn(TD_NUM, "py-3 font-semibold!")}>{usd(totals.fee)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="border-t border-border px-4 py-3 text-[12.5px]! text-muted sm:px-5">
        {k("table.selectedCount")
          .replace("{selected}", String(checked.size))
          .replace("{total}", String(rows.length))}
      </div>
    </>
  );
}
