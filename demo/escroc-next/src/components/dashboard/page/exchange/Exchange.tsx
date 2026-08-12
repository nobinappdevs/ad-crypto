"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Percent,
  BadgeDollarSign,
  Info,
  Wallet,
  ArrowDown,
} from "lucide-react";
import { Panel, PanelHeader, StatusBadge, TableFooter, dsx } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { useMoneyExchange, useSubmitExchange } from "@/hooks/useExchange";
import { useKycGate } from "@/hooks/useKyc";

/* Map a wallet to a shared-Select option (flag, code, type badge, balance). */
function walletOption(w: any, flagUrl: (w: any) => string): SelectOption {
  return {
    value: w.currency_code,
    label: w.currency_code,
    badge: w.currency_type,
    sub: w.name,
    image: flagUrl(w) || undefined,
    imageFallback: <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{w.currency_symbol}</span>,
    right: `${w.currency_symbol}${Number(w.balance).toLocaleString()}`,
    keywords: `${w.currency_code} ${w.name} ${w.currency_type}`,
  };
}

const fmtRate = (r: number) =>
  r >= 1 ? r.toFixed(3) : r >= 0.001 ? r.toFixed(4) : r.toPrecision(3);

// ISO → "YYYY-MM-DD HH:mm" without locale (keeps SSR/client output identical).
const fmtTxnDate = (iso?: string) => (iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "—");

/* numeric status → i18n key + StatusBadge tone
   (1 SUCCESS, 2 PENDING, 3 HOLD, 4 REJECTED, 5 WAITING, 6 FAILED) */
const TXN_STATUS: Record<number, { key: string; tone: string }> = {
  1: { key: "dashboard.status.success", tone: "success" },
  2: { key: "dashboard.status.pending", tone: "pending" },
  3: { key: "dashboard.status.hold", tone: "pending" },
  4: { key: "dashboard.status.rejected", tone: "danger" },
  5: { key: "dashboard.status.waiting", tone: "info" },
  6: { key: "dashboard.status.failed", tone: "danger" },
};

/* string_status → StatusBadge tone */
function logStatusTone(status: string) {
  const s = (status ?? "").toLowerCase();
  if (/success|complete|approved|paid/.test(s)) return "success";
  if (/pending|process/.test(s)) return "pending";
  if (/wait/.test(s)) return "info";
  if (/reject|fail|cancel|declin/.test(s)) return "danger";
  return "neutral";
}

/* status-filter options for the log */
const STATUS_OPTS: SelectOption[] = [
  { value: "", label: "dashboard.status.all" },
  { value: "Success", label: "dashboard.status.success" },
  { value: "Pending", label: "dashboard.status.pending" },
  { value: "Waiting", label: "dashboard.status.waiting" },
  { value: "Rejected", label: "dashboard.status.rejected" },
];

/* ─────────────────────────── currency dropdown ─────────────────────────── */

function CurrencyDropdown({ value, wallets, onChange, flagUrl }: {
  value: string; wallets: any[]; onChange: (code: string) => void; flagUrl: (w: any) => string;
}) {
  const { t } = useLang();
  return (
    <Select
      variant="chip"
      value={value}
      onChange={onChange}
      options={wallets.map((w) => walletOption(w, flagUrl))}
      aria-label={t("dashboard.common.currency")}
    />
  );
}

/* ─────────────────────────── loading skeleton ─────────────────────────── */

function SkLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

function ExchangeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* form */}
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6 sm:py-5">
            <SkLine className="h-4 w-40" />
            <SkLine className="h-7 w-28 rounded-lg" />
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            <SkLine className="h-12 w-full rounded-xl" />
            <SkLine className="h-11 w-full rounded-xl" />
            <SkLine className="mx-auto h-8 w-8 rounded-full" />
            <SkLine className="h-11 w-full rounded-xl" />
            <SkLine className="h-12 w-full rounded-xl" />
          </div>
        </Panel>
        {/* summary */}
        <Panel>
          <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><SkLine className="h-4 w-32" /></div>
          <div className="divide-y divide-border">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                <SkLine className="h-8 w-8 rounded-xl" />
                <SkLine className="h-3 flex-1" />
                <SkLine className="h-3 w-16" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      {/* log */}
      <Panel>
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <SkLine className="h-4 w-40" />
          <SkLine className="h-9 w-52 rounded-xl" />
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkLine key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export function Exchange() {
  const { t } = useLang();

  const SUMMARY_ROWS = [
    { key: "fromWallet",   labelKey: "dashboard.exchange.fromWallet",          Icon: Wallet },
    { key: "toExchange",   labelKey: "dashboard.exchange.toExchange",          Icon: ArrowLeftRight },
    { key: "rate",         labelKey: "dashboard.exchange.exchangeRate",        Icon: RefreshCw },
    { key: "totalExch",    labelKey: "dashboard.exchange.totalExchangeAmount", Icon: BadgeDollarSign },
    { key: "converted",    labelKey: "dashboard.exchange.convertedAmount",     Icon: ArrowDown },
    { key: "totalCharge",  labelKey: "dashboard.exchange.totalCharge",         Icon: Percent },
    { key: "totalPayable", labelKey: "dashboard.exchange.totalPayable",        Icon: BadgeDollarSign },
  ];

  const statusOpts: SelectOption[] = STATUS_OPTS.map((o) => ({ ...o, label: t(o.label) }));

  const { data: res, isLoading } = useMoneyExchange();
  const d = (res as any)?.data;
  const wallets: any[] = d?.userWallet ?? [];
  const charges = d?.charges;
  const baseUrl: string = d?.base_url ?? "";
  const txns: any[] = d?.transactionss ?? [];

  const walletOf = (code: string) => wallets.find((w) => w.currency_code === code);
  const flagUrl = (w: any) => (w?.flag ? `${baseUrl}${w.image_path}/${w.flag}` : "");

  const [fromCur, setFromCur] = useState("USD");
  const [toCur,   setToCur]   = useState("AUD");
  const [rawAmount, setRawAmount] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [logQuery, setLogQuery] = useState("");
  const [logStatus, setLogStatus] = useState("");

  // Once wallets load, make sure the selected currencies actually exist.
  if (!seeded && wallets.length) {
    setSeeded(true);
    if (!walletOf(fromCur)) setFromCur(wallets[0].currency_code);
    if (!walletOf(toCur)) setToCur(wallets[1]?.currency_code ?? wallets[0].currency_code);
  }

  const fromWallet = walletOf(fromCur);
  const toWallet   = walletOf(toCur);
  const rateFrom = fromWallet?.rate ?? 1;   // 1 USD = rateFrom fromCur
  const rateTo   = toWallet?.rate ?? 1;      // 1 USD = rateTo toCur
  const rate     = rateFrom ? rateTo / rateFrom : 1;   // 1 fromCur = rate toCur
  const amount   = parseFloat(rawAmount) || 0;

  // Fiat wallets show 2 decimals, crypto 8 — matches the reference app.
  const fromDp = fromWallet?.currency_type === "CRYPTO" ? 8 : 2;
  const toDp   = toWallet?.currency_type === "CRYPTO" ? 8 : 2;

  const feePctRate   = charges?.percent_charge ?? 0;
  const fixedBase    = charges?.fixed_charge ?? 0;  // stored in the base currency (USD)
  const limitMinBase = charges?.min_limit ?? 0;
  const limitMaxBase = charges?.max_limit ?? 0;

  // Fixed charge is a base-currency (USD) amount → convert into the from-currency (× rateFrom).
  const fixedFrom    = fixedBase * rateFrom;
  const feePctAmt    = amount * (feePctRate / 100); // percent applies to the entered (from) amount
  const totalCharge  = fixedFrom + feePctAmt;
  const converted    = amount * rate;
  const totalPayable = amount + totalCharge;

  // Limits sit on the destination side → shown in the from-currency (÷ rate).
  const limitMinFrom = rate ? limitMinBase / rate : limitMinBase;
  const limitMaxFrom = rate ? limitMaxBase / rate : limitMaxBase;

  const fromBalance = fromWallet?.balance ?? 0;
  const fromSym = fromWallet?.currency_symbol ?? "";

  const money = (n: number, cur: string, dp: number) => `${(Number(n) || 0).toFixed(dp)} ${cur}`;

  const summaryValues: Record<string, string> = {
    fromWallet:   fromCur,
    toExchange:   toCur,
    rate:         `1 ${fromCur} = ${fmtRate(rate)} ${toCur}`,
    totalExch:    `${amount.toLocaleString()} ${fromCur}`,
    converted:    money(converted, toCur, toDp),
    totalCharge:  money(totalCharge, fromCur, fromDp),
    totalPayable: money(totalPayable, fromCur, fromDp),
  };

  const isSameCurrency = fromCur === toCur;

  const submitExchange = useSubmitExchange();
  const kycGate = useKycGate();
  const canSubmit =
    amount > 0 && !isSameCurrency && amount >= limitMinFrom && amount <= limitMaxFrom;

  const onExchange = async () => {
    if (!(await kycGate())) return;
    submitExchange.mutate(
      {
        exchange_from_amount: amount,
        exchange_from_currency: fromCur,
        exchange_to_amount: converted,
        exchange_to_currency: toCur,
      },
      { onSuccess: () => setRawAmount("") },
    );
  };

  // Show the skeleton while the exchange info loads for the first time.
  if (isLoading && !d) return <ExchangeSkeleton />;

  // Log search + status filter (client-side over the loaded rows).
  const logStatusOf = (log: any) => {
    if (log.string_status) return log.string_status;
    const meta = TXN_STATUS[Number(log.status)];
    if (meta) return t(meta.key);
    return log.rejection_reason ? t("dashboard.status.rejected") : t("dashboard.status.success");
  };
  const logStatusToneOf = (log: any) => TXN_STATUS[Number(log.status)]?.tone ?? logStatusTone(logStatusOf(log));
  const lq = logQuery.trim().toLowerCase();
  const logFiltering = lq !== "" || logStatus !== "";
  const filteredLogs = txns.filter((log) => {
    const st = logStatusOf(log);
    if (logStatus && st.toLowerCase() !== logStatus.toLowerCase()) return false;
    if (lq) {
      const hay = [log.trx_id, st, log.sender_currency_code, log.exchange_currency]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(lq)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── top: form + summary ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

        {/* form card */}
        <Panel>
          <PanelHeader title={t("dashboard.exchange.title")}>
            <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <ArrowLeftRight size={13} strokeWidth={2.5} aria-hidden />
              {t("dashboard.exchange.currencySwap")}
            </span>
          </PanelHeader>

          <div className="p-4 sm:p-6">
            {/* exchange rate strip */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-center">
              <RefreshCw size={15} strokeWidth={2} className="text-primary" aria-hidden />
              <p className="text-sm font-medium text-muted">
                {t("dashboard.exchange.exchangeRateLabel")}:{" "}
                <span className="font-bold text-primary">
                  1 {fromCur} = {fmtRate(rate)} {toCur}
                </span>
              </p>
            </div>

            {/* exchange from */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs flex gap-x-1.5 font-semibold uppercase tracking-wide text-muted">
                {t("dashboard.exchange.exchangeFrom")} <span className="text-amber-500">*</span>
              </label>
              <div className="flex h-11 rounded-xl border border-border bg-surface transition focus-within:border-primary">
                <input
                  type="number"
                  min={0}
                  placeholder={t("dashboard.exchange.enterAmount")}
                  value={rawAmount}
                  onChange={(e) => setRawAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-heading outline-none placeholder:text-muted"
                />
                <CurrencyDropdown value={fromCur} wallets={wallets} onChange={setFromCur} flagUrl={flagUrl} />
              </div>
              <p className="text-right text-xs text-muted">
                {t("dashboard.exchange.availableBalance")}: <span className="font-semibold text-primary">{fromSym}{fromBalance}</span>
              </p>
            </div>

            {/* swap arrow */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <button
                onClick={() => { setFromCur(toCur); setToCur(fromCur); }}
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-border bg-surface text-muted transition hover:border-primary hover:text-primary"
                aria-label={t("dashboard.exchange.swapCurrencies")}
              >
                <ArrowLeftRight size={14} strokeWidth={2} aria-hidden />
              </button>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* exchange to */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs flex gap-x-1.5  font-semibold uppercase tracking-wide text-muted">
                {t("dashboard.exchange.exchangeTo")} <span className="text-amber-500">*</span>
              </label>
              <div className="flex h-11 rounded-xl border border-border bg-surface/60">
                <input
                  readOnly
                  value={amount > 0 ? converted.toFixed(toDp) : "0.00"}
                  className="min-w-0 flex-1 cursor-default bg-transparent px-4 text-sm font-medium text-muted outline-none"
                />
                <CurrencyDropdown value={toCur} wallets={wallets} onChange={setToCur} flagUrl={flagUrl} />
              </div>
            </div>

            {/* limit + charge row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-xs text-muted">
                <Info size={12} strokeWidth={2} aria-hidden />
                {t("dashboard.exchange.limit")}:{" "}
                <span className="font-semibold text-amber-500">
                  {limitMinFrom.toFixed(fromDp)} {fromCur} – {limitMaxFrom.toFixed(fromDp)} {fromCur}
                </span>
              </p>
              <p className="text-xs text-muted">
                {t("dashboard.exchange.charge")}:{" "}
                <span className="font-semibold text-amber-500">
                  {fixedFrom.toFixed(fromDp)} {fromCur} + {feePctRate}% = {totalCharge.toFixed(fromDp)} {fromCur}
                </span>
              </p>
            </div>

            {/* same currency warning */}
            {isSameCurrency && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Info size={12} strokeWidth={2} aria-hidden />
                {t("dashboard.exchange.sameCurrencyWarning")}
              </p>
            )}

            {/* submit */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-5"
              disabled={!canSubmit}
              loading={submitExchange.isPending}
              onClick={onExchange}
              leftIcon={<ArrowLeftRight size={17} strokeWidth={2.5} aria-hidden />}
            >
              {t("dashboard.exchange.exchangeMoney")}
            </Button>
          </div>
        </Panel>

        {/* summary card */}
        <Panel>
          <PanelHeader title={t("dashboard.exchange.summary")} />
          <div className="divide-y divide-border">
            {SUMMARY_ROWS.map(({ key, labelKey, Icon }, i) => {
              const isLast = i === SUMMARY_ROWS.length - 1;
              const isHighlight = key === "totalExch";
              return (
                <div
                  key={key}
                  className={`flex items-center gap-4 px-6 py-3.5 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${
                    isLast ? "bg-primary/[0.04]" : ""
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${
                      isLast || isHighlight
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} aria-hidden />
                  </div>
                  <p className={`flex-1 text-xs font-medium ${isLast ? "text-primary" : "text-muted"}`}>
                    {t(labelKey)}
                  </p>
                  <p
                    className={`shrink-0 whitespace-nowrap text-sm font-bold tabular-nums ${
                      isLast || isHighlight ? "text-primary" : "text-heading"
                    }`}
                  >
                    {summaryValues[key]}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3.5 sm:px-6 sm:py-4">
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
              <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
              {t("dashboard.exchange.ratesInfoNote")}
            </p>
          </div>
        </Panel>
      </div>

      {/* ── exchange log ── */}
      <Panel>
        <PanelHeader title={t("dashboard.exchange.logTitle")} badge={txns.length}>
          <div className="w-full sm:flex-1 lg:w-52 lg:flex-none">
            <Input
              type="text"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder={t("dashboard.exchange.searchLogs")}
              leftIcon={<Search size={16} strokeWidth={2} aria-hidden />}
            />
          </div>
          <div className="w-full sm:w-40 sm:shrink-0">
            <Select
              value={logStatus}
              onChange={setLogStatus}
              options={statusOpts}
              leftIcon={<SlidersHorizontal size={15} strokeWidth={2} aria-hidden />}
              aria-label={t("dashboard.exchange.filter")}
            />
          </div>
        </PanelHeader>

        <div className="scroll-x">
          <table className="dash-table w-full min-w-210 border-collapse text-left">
            <thead>
              <tr className="border-b-0">
                <th className={dsx.th}>{t("dashboard.exchange.colTransaction")}</th>
                <th className={`${dsx.th} hidden sm:table-cell`}>{t("dashboard.exchange.colStatus")}</th>
                <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.exchange.colTransactionId")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.exchange.colExchangeRate")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.exchange.colFeesCharge")}</th>
                <th className={`${dsx.th} text-right`}>{t("dashboard.exchange.colAmount")}</th>
                <th className={`${dsx.th} hidden whitespace-nowrap md:table-cell`}>{t("dashboard.exchange.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <ArrowLeftRight size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.exchange.noLogsTitle")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.exchange.noLogsDesc")}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/5 text-muted dark:bg-white/10">
                      <Search size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.exchange.noMatchTitle")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.exchange.noMatchDesc")}</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cc = log.sender_currency_code;
                  const payable = Number(log.total_payable).toFixed(2);
                  const statusText = logStatusOf(log);
                  const statusTone = logStatusToneOf(log);
                  return (
                    <tr key={log.trx_id ?? log.id} className={dsx.rowHover}>
                      <td className={dsx.td}>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <ArrowLeftRight size={16} strokeWidth={2} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <div className="whitespace-nowrap text-sm font-semibold text-heading">
                              {t("dashboard.exchange.exchangeMoney")}{" "}
                              <span className="font-semibold text-primary">{cc}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${dsx.td} hidden whitespace-nowrap sm:table-cell`}>
                        <StatusBadge tone={statusTone}>{statusText}</StatusBadge>
                      </td>
                      <td className={`${dsx.td} hidden whitespace-nowrap font-mono text-sm text-muted md:table-cell`}>
                        {log.trx_id}
                      </td>
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-body lg:table-cell`}>
                        1 {cc} = {log.exchange_rate}
                      </td>
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-body lg:table-cell`}>
                        {Number(log.fee).toFixed(2)} {cc}
                      </td>
                      <td className={`${dsx.td} text-right`}>
                        <div className="whitespace-nowrap text-sm font-bold tabular-nums text-primary">
                          {Number(log.sender_request_amount).toLocaleString()} {cc}
                        </div>
                        <div className="mt-0.5 whitespace-nowrap text-xs tabular-nums text-muted">
                          {t("dashboard.exchange.totalPayable")}: {payable} {cc}
                        </div>
                      </td>
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-muted md:table-cell`}>
                        {fmtTxnDate(log.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
