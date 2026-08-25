"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ExternalLink,
  Receipt,
  X,
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
  txGateway,
  txMethod,
  txNetwork,
  txPayUrl,
  txStatusKey,
  txSubmitted,
  txTypeKey,
  type TxDetail,
} from "@/config/txlog";

const DIRECTION_META = {
  in: { Icon: ArrowDownLeft, tone: "bg-hero-mint/12 text-hero-mint" },
  out: { Icon: ArrowUpRight, tone: "bg-hero-neg/12 text-hero-neg" },
  neutral: { Icon: ArrowLeftRight, tone: "bg-primary/12 text-primary" },
} as const;

/**
 * One order, in full — the sheet the ledger's rows open.
 *
 * A dialog rather than the expanding row this replaces: the interesting rows carry
 * three groups of fields, and pushing thirty of them into the table pushed every
 * other row off the screen. A sheet also has room to LEAD with the figures (what was
 * bought, what it cost) instead of opening on a flat list of labels.
 *
 * Portalled, so no `overflow-hidden` panel between here and `<body>` can clip it.
 */
export function TransactionModal({
  tx,
  onClose,
}: {
  tx: DashboardTransaction | null;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const k = (name: string) => t(`dashboard.${name}`);

  /**
   * Escape closes, and the page behind stops scrolling while it is open — a sheet
   * that moves when the wheel turns reads as part of the page rather than over it.
   */
  useEffect(() => {
    if (!tx) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [tx, onClose]);

  if (!tx) return null;

  const typeKey = txTypeKey(tx.type);
  const direction = typeKey ? TX_DIRECTION[typeKey] : "neutral";
  const { Icon, tone } = DIRECTION_META[direction];
  const coin = txCoin(tx);
  const brand = coinBrand(coin.code || coin.name);
  const statusKey = txStatusKey(tx.status);
  const { date, time } = txDateTime(tx.created_at, lang);
  const network = txNetwork(tx);
  const { method, wallet } = txMethod(tx);

  const details = txDetails(tx);
  const submitted = txSubmitted(tx);
  const gateway = txGateway(tx, lang);
  const payUrl = txPayUrl(tx);

  /** A detail's label: the translation for a key we know, its humanised key otherwise. */
  const detailLabel = (detail: TxDetail) => {
    const path = `txDetail.${detail.key}`;
    const translated = k(path);
    return translated === `dashboard.${path}` ? detail.label : translated;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={k("table.details")}
        onClick={(event) => event.stopPropagation()}
        style={{ animation: "panel-rise 0.28s ease both" }}
        // A column with a scrolling middle, so the header and the actions stay put
        // however long the field list is.
        className="flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card"
      >
        {/* ---- Header */}
        <div className="flex items-start gap-3 border-b border-border p-4 sm:p-5">
          <span
            aria-hidden
            className={cn("grid! h-11 w-11 shrink-0 place-items-center rounded-2xl", tone)}
          >
            <Icon size={19} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px]! font-bold! sm:text-[17px]!">
              {typeKey ? k(`txType.${typeKey}`) : tx.type || k("table.details")}
            </h2>
            <p className="mt-0.5 truncate text-[12.5px]! text-muted">
              {[tx.trx_id, date, time].filter(Boolean).join(" · ")}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex! shrink-0 items-center gap-1.5 rounded-full border border-current/20 px-2.5 py-1 text-[12px]! font-semibold!",
              TX_STATUS_CLASS[statusKey],
            )}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
            {k(`txStatus.${statusKey}`)}
          </span>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label={k("closeMenu")}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition hover:bg-black/5 hover:text-heading dark:hover:bg-white/6"
          >
            <X size={17} />
          </button>
        </div>

        {/* ---- Scrolling body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {/* The headline figure, and the two numbers that qualify it. Leading with
              these is the reason this is a sheet and not a list. */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              {(coin.code || coin.name) && (
                <CoinBadge color={brand.color} glyph={brand.glyph} size={38} />
              )}
              <div className="min-w-0">
                <div className="text-[24px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums sm:text-[27px]!">
                  {coinAmount(tx.amount)}{" "}
                  <span className="inline! font-bold! text-primary">{coin.code}</span>
                </div>
                {coin.name && <p className="mt-1 text-[12.5px]! text-muted">{coin.name}</p>}
              </div>
            </div>

            {/* Charge and payable are on every row; network and method are on a
                minority, and a strip of em dashes is worse than a shorter strip —
                so those two only take a slot when the server sent one. */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={k("table.charge")} value={coinAmount(tx.total_charge)} />
              <Stat label={k("table.payable")} value={coinAmount(tx.total_payable)} strong />
              {network && <Stat label={k("table.network")} value={network} />}
              {method && <Stat label={k("table.method")} value={method} hint={wallet} />}
            </div>
          </div>

          {/* A rejection is the one thing a reader opens this sheet FOR, so it sits
              above the field list rather than inside it. */}
          {tx.reject_reason && (
            <p className="mt-4 rounded-2xl border border-hero-neg/25 bg-hero-neg/8 px-4 py-3 text-[12.5px]! leading-relaxed! text-hero-neg">
              {tx.reject_reason}
            </p>
          )}

          <Group
            title={k("table.details")}
            rows={details}
            label={detailLabel}
            open={k("table.open")}
          />
          <Group
            title={k("table.submitted")}
            rows={submitted}
            label={detailLabel}
            open={k("table.open")}
          />
          <Group
            title={k("table.gateway")}
            rows={gateway}
            label={detailLabel}
            open={k("table.open")}
          />
        </div>

        {/* ---- Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border p-4 sm:p-5">
          {payUrl && (
            <a
              href={payUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-lift inline-flex! h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white!"
            >
              {k("table.continuePayment")}
              <ExternalLink size={14} aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center rounded-full border border-border px-4 text-[13px] font-semibold text-heading transition hover:border-primary hover:text-primary"
          >
            {k("table.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** One figure in the summary strip. An empty value renders an em dash, not a gap. */
function Stat({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px]! font-semibold! tracking-[0.04em] text-muted uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 truncate text-[13.5px]! tabular-nums",
          strong ? "font-bold!" : "font-semibold!",
        )}
      >
        {value || "—"}
      </p>
      {hint && <p className="truncate text-[11.5px]! text-muted">{hint}</p>}
    </div>
  );
}

/**
 * One titled block of label/value pairs, or nothing when the group is empty.
 *
 * Titled because unlabelled they read as one long list, where "Transaction ID" (the
 * user's own reference) sits beside "Gateway reference" (Stripe's) with nothing to
 * tell them apart.
 */
function Group({
  title,
  rows,
  label,
  open,
}: {
  title: string;
  rows: TxDetail[];
  label: (detail: TxDetail) => string;
  open: string;
}) {
  if (rows.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="flex items-center gap-2">
        <Receipt size={13} aria-hidden className="shrink-0 text-muted" />
        <h3 className="text-[12px]! font-semibold! tracking-[0.04em] text-muted uppercase">
          {title}
        </h3>
        <span className="text-[11.5px]! text-muted">{rows.length}</span>
      </div>

      <dl className="mt-1.5 overflow-hidden rounded-2xl border border-border">
        {rows.map((detail, i) => (
          <div
            key={detail.key}
            className={cn(
              "flex items-start justify-between gap-4 px-3.5 py-2.5",
              // Zebra rather than rules: thirty rows of dividers is a lot of line,
              // and the tint keeps a long list scannable at a glance.
              i % 2 === 1 && "bg-surface",
            )}
          >
            <dt className="shrink-0 text-[12.5px]! text-muted">{label(detail)}</dt>
            <dd className="min-w-0 text-end text-[12.5px]! font-semibold! wrap-break-word">
              {detail.href ? (
                <a
                  href={detail.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex! items-center gap-1 text-primary hover:underline"
                >
                  {open}
                  <ExternalLink size={12} aria-hidden />
                </a>
              ) : (
                detail.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
