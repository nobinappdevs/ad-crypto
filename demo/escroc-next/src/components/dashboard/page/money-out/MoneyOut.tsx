"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  SlidersHorizontal,
  SendHorizontal,
  RefreshCw,
  Percent,
  BadgeDollarSign,
  Info,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { Panel, PanelHeader, StatusBadge, TableFooter, dsx } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { useMoneyOut, useSubmitMoneyOut, useConfirmMoneyOut, useFlutterwaveBanks, useFlutterwaveBranches } from "@/hooks/useMoneyOut";

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

/* ─────────────────────────── dropdowns (shared Select) ─────────────────────────── */

/* wallet currency chip (sits inside the amount field) */
function WalletDropdown({ value, wallets, onChange, flagUrl }: {
  value: string; wallets: any[]; onChange: (c: string) => void; flagUrl: (w: any) => string;
}) {
  const { t } = useLang();
  const options: SelectOption[] = wallets.map((w) => ({
    value: w.currency_code,
    label: w.currency_code,
    badge: w.currency_type,
    sub: w.name,
    image: flagUrl(w) || undefined,
    imageFallback: <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{w.currency_symbol}</span>,
    right: `${w.currency_symbol}${Number(w.balance).toLocaleString()}`,
    keywords: `${w.currency_code} ${w.name} ${w.currency_type}`,
  }));
  return <Select variant="chip" value={value} onChange={onChange} options={options} aria-label={t("dashboard.common.currency")} />;
}

/* payment gateway (full-width) */
function GatewayDropdown({ value, gateways, onChange, gwLogo }: {
  value: number; gateways: any[]; onChange: (id: number) => void; gwLogo: (g: any) => string;
}) {
  const options: SelectOption[] = gateways.map((g) => ({
    value: String(g.id),
    label: g.name,
    badge: g.type,
    sub: `${g.currency_symbol}${Number(g.min_limit).toLocaleString()} – ${g.currency_symbol}${Number(g.max_limit).toLocaleString()}`,
    image: gwLogo(g) || undefined,
    imageRounded: "md",
    keywords: `${g.name} ${g.type}`,
  }));
  return <Select value={String(value)} onChange={(v) => onChange(Number(v))} options={options} />;
}

/* dynamic-field select (bank / branch / country …) — searchable */
function SelectDropdown({ field, value, onChange }: {
  field: any; value: any; onChange: (name: string, value: any) => void;
}) {
  const { t } = useLang();
  const options: SelectOption[] = (field.options ?? []).map((o: any, i: number) => ({
    id: String(o.id ?? i), // options may repeat `code`/`name` across rows — id keeps React keys unique
    value: String(o.code ?? o.name),
    label: o.name,
    keywords: o.name,
  }));
  return (
    <Select
      value={value ?? ""}
      onChange={(v) => onChange(field.name, v)}
      options={options}
      placeholder={field.place_holder}
      searchable
      searchPlaceholder={t("common.search")}
    />
  );
}

/* ─────────────────────────── dynamic field ─────────────────────────── */

function DynField({ field, value, onChange }: {
  field: any; value: any; onChange: (name: string, value: any) => void;
}) {
  const base = "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {field.label} {field.required && <span className="inline text-red-500">*</span>}
      </label>

      {field.type === "select" ? (
        <SelectDropdown field={field} value={value} onChange={onChange} />
      ) : field.type === "file" ? (
        <input
          type="file"
          required={field.required}
          onChange={(e) => onChange(field.name, e.target.files?.[0] ?? null)}
          className="w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary focus:border-primary"
        />
      ) : field.type === "textarea" ? (
        <textarea
          rows={3}
          value={value ?? ""}
          required={field.required}
          placeholder={field.place_holder}
          onChange={(e) => onChange(field.name, e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary"
        />
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={value ?? ""}
          required={field.required}
          placeholder={field.place_holder}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── skeleton ─────────────────────────── */

function SkLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

function MoneyOutSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6 sm:py-5">
            <SkLine className="h-4 w-36" /><SkLine className="h-7 w-28 rounded-lg" />
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            <SkLine className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SkLine className="h-11 w-full rounded-xl" />
              <SkLine className="h-11 w-full rounded-xl" />
            </div>
            <SkLine className="h-11 w-full rounded-xl" />
          </div>
        </Panel>
        <Panel>
          <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><SkLine className="h-4 w-28" /></div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
                <SkLine className="h-9 w-9 rounded-xl" /><SkLine className="h-3 flex-1" /><SkLine className="h-3 w-16" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel>
        <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <SkLine className="h-4 w-40" /><SkLine className="h-9 w-52 rounded-xl" />
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          {Array.from({ length: 3 }).map((_, i) => <SkLine key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </Panel>
    </div>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export function MoneyOut() {
  const { t } = useLang();

  const SUMMARY_ROWS = [
    { key: "entered",    labelKey: "dashboard.moneyOut.enteredAmount",    Icon: Wallet },
    { key: "conversion", labelKey: "dashboard.moneyOut.conversionAmount", Icon: ArrowLeftRight },
    { key: "fees",       labelKey: "dashboard.moneyOut.totalFees",        Icon: Percent },
    { key: "willGet",    labelKey: "dashboard.moneyOut.willGet",          Icon: TrendingDown },
    { key: "payable",    labelKey: "dashboard.moneyOut.totalPayable",     Icon: BadgeDollarSign },
  ];

  const statusOpts: SelectOption[] = STATUS_OPTS.map((o) => ({ ...o, label: t(o.label) as string }));

  const { data: res, isLoading } = useMoneyOut();
  const d = (res as any)?.data;
  const wallets: any[] = d?.userWallet ?? [];
  const gateways: any[] = d?.gatewayCurrencies ?? [];
  const txns: any[] = d?.transactionss ?? [];
  const baseUrl: string = d?.base_url ?? "";
  const baseCurr: string = d?.base_curr ?? "USD";

  const walletOf = (code: string) => wallets.find((w) => w.currency_code === code);
  const flagUrl = (w: any) => (w?.flag ? `${baseUrl}${w.image_path}/${w.flag}` : "");
  const gwLogo = (g: any) => (g?.image ? `${baseUrl}${d?.image_path}/${g.image}` : `${baseUrl}${d?.default_image}`);

  const [gatewayId, setGatewayId] = useState<number>(0);
  const [fromCur, setFromCur] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [logQuery, setLogQuery] = useState("");
  const [logStatus, setLogStatus] = useState("");

  // Seed defaults once data arrives.
  if (!seeded && gateways.length && wallets.length) {
    setSeeded(true);
    setGatewayId(gateways[0].id);
    setFromCur(walletOf(baseCurr) ? baseCurr : wallets[0].currency_code);
  }

  const gw = gateways.find((g) => g.id === gatewayId) ?? gateways[0];
  const fromWallet = walletOf(fromCur);

  const walletRate = fromWallet?.rate ?? 1;
  const gwRate = gw?.rate ?? 1;
  const rate = walletRate ? gwRate / walletRate : 1; // 1 fromCur = rate gatewayCurrency
  const amount = parseFloat(rawAmount) || 0;

  const gwCur = gw?.currency_code ?? "";
  const feeFixed = gw?.fixed_charge ?? 0;
  const feePctRate = gw?.percent_charge ?? 0;

  const converted = +(amount * rate).toFixed(2);
  const feesPct   = +(converted * (feePctRate / 100)).toFixed(2);
  const totalFees = +(feeFixed + feesPct).toFixed(2);
  const willGet   = +(converted - totalFees).toFixed(2);
  const payable   = amount;

  const fromSym = fromWallet?.currency_symbol ?? "";
  const fromBalance = fromWallet?.balance ?? 0;

  const fmt = (n: number, cur: string) => (n > 0 ? `${n.toLocaleString()} ${cur}` : "—");

  const summaryValues: Record<string, string> = {
    entered:    fmt(amount, fromCur),
    conversion: fmt(converted, gwCur),
    fees:       fmt(totalFees, gwCur),
    willGet:    fmt(willGet > 0 ? willGet : 0, gwCur),
    payable:    fmt(payable, fromCur),
  };

  // Shared summary card — identical in both step 1 and step 2 (right column).
  const summaryCard = (
    <Panel>
      <PanelHeader title={t("dashboard.moneyOut.summary")} />
      <div className="divide-y divide-border">
        {SUMMARY_ROWS.map(({ key, labelKey, Icon }, i) => {
          const isLast    = i === SUMMARY_ROWS.length - 1;
          const isWillGet = key === "willGet";
          return (
            <div
              key={key}
              className={`flex items-center gap-4 px-6 py-4 transition hover:bg-black/2 dark:hover:bg-white/2 ${
                isLast ? "bg-primary/4" : ""
              }`}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                  isLast
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : isWillGet
                    ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
                    : "border-border bg-surface text-muted"
                }`}
              >
                <Icon size={16} strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-medium ${
                    isLast ? "text-primary" : isWillGet ? "text-indigo-500 dark:text-indigo-400" : "text-muted"
                  }`}
                >
                  {t(labelKey)}
                </p>
              </div>
              <p
                className={`shrink-0 whitespace-nowrap text-sm font-bold tabular-nums ${
                  isLast ? "text-primary" : isWillGet ? "text-indigo-500 dark:text-indigo-400" : "text-heading"
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
          {t("dashboard.moneyOut.balanceNote")}
        </p>
      </div>
    </Panel>
  );

  // ── step-2 withdraw flow ──
  const submit = useSubmitMoneyOut();
  const [step2, setStep2] = useState<any | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Gateway limits are in the gateway currency, so compare the converted amount.
  const min = Number(gw?.min_limit ?? 0);
  const max = Number(gw?.max_limit ?? 0);
  const canSubmit = amount > 0 && converted >= min && converted <= max;

  // The limit is shown in the wallet (sender) currency the user is typing in —
  // convert the gateway-currency limit back through the rate (1 fromCur = rate gwCur).
  const fmtLimit = (n: number) => n.toFixed(3);
  const minSender = rate ? min / rate : min;
  const maxSender = rate ? max / rate : max;

  const onMoneyOut = () => {
    if (!gw) return;
    submit.mutate(
      { gateway_currency: gw.alias, sender_currency: fromCur, amount },
      {
        onSuccess: (r: any) => {
          const dd = r?.data;
          const init: Record<string, any> = {};
          (dd?.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
          setFieldValues(init);
          setStep2(dd);
        },
      },
    );
  };

  const setField = (name: string, value: any) =>
    setFieldValues((p) => {
      const next = { ...p, [name]: value };
      if (name === "bank_name") next.branch_code = ""; // bank changed → branch no longer valid
      return next;
    });

  // ── step-2 confirm (automatic / manual) + Flutterwave banks/branches ──
  const confirm = useConfirmMoneyOut();
  // MANUAL gateways return `payment_informations` (plural); AUTOMATIC use the singular key.
  const trx: string | undefined =
    step2?.payment_information?.trx ?? step2?.payment_informations?.trx;
  const isFlutter = !!step2?.alias?.includes("flutterwave");
  const banksQ = useFlutterwaveBanks(trx, !!step2 && isFlutter);
  const banks = banksQ.data?.data?.bank_info ?? [];

  // Branch list depends on the bank the user just picked (its real id, not its code).
  const selectedBankId = banks.find((b: any) => b.code === fieldValues.bank_name)?.id;
  const branchesQ = useFlutterwaveBranches(trx, selectedBankId, !!step2 && isFlutter);
  const branches = branchesQ.data?.data?.bank_branches ?? [];

  const onConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2) return;
    confirm.mutate(
      { gatewayType: step2.gateway_type, trx: trx ?? "", fields: fieldValues },
      { onSuccess: () => { setStep2(null); setRawAmount(""); } },
    );
  };

  // Skeleton on first load.
  if (isLoading && !d) return <MoneyOutSkeleton />;

  // ── Step 2: dynamic withdraw form + payment information ──
  if (step2) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* dynamic withdraw form */}
          <Panel>
            <PanelHeader title={`${t("dashboard.moneyOut.via")} ${step2.gateway_currency_name}`}>
              <button
                type="button"
                onClick={() => setStep2(null)}
                className={`cursor-pointer ${dsx.btnGhost}`}
              >
                {t("dashboard.common.previous")}
              </button>
            </PanelHeader>
            <form onSubmit={onConfirm} className="flex flex-col gap-5 p-4 sm:p-6">
              {(step2.input_fields ?? []).map((f: any) => {
                // Flutterwave banks/branches arrive from separate endpoints — inject them.
                let field = f;
                if (f.name === "bank_name" && banks.length) {
                  field = { ...f, options: banks };
                } else if (f.name === "branch_code") {
                  const branchOptions = branches.map((b: any) => ({ id: b.id, code: b.branch_code, name: b.branch_name }));
                  field = {
                    ...f,
                    options: branchOptions,
                    place_holder: !fieldValues.bank_name
                      ? t("dashboard.moneyOut.selectBankFirst")
                      : branchesQ.isFetching
                      ? t("dashboard.moneyOut.loadingBranches")
                      : f.place_holder,
                  };
                }
                return <DynField key={f.name} field={field} value={fieldValues[f.name]} onChange={setField} />;
              })}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={confirm.isPending}
                leftIcon={<SendHorizontal size={17} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.moneyOut.confirm")}
              </Button>
            </form>
          </Panel>

          {/* summary — unchanged from step 1 */}
          {summaryCard}
        </div>
      </div>
    );
  }

  // Wait for gateways/wallets before rendering the step-1 form.
  if (!gw || !fromWallet) return <MoneyOutSkeleton />;

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
      const hay = [log.trx_id, log.gateway_currency, st, log.sender_currency_code]
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
          <PanelHeader title={t("dashboard.moneyOut.title")}>
            <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <SendHorizontal size={13} strokeWidth={2.5} aria-hidden />
              {t("dashboard.moneyOut.withdrawFunds")}
            </span>
          </PanelHeader>

          <div className="p-4 sm:p-6">
            {/* exchange rate strip */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-center">
              <RefreshCw size={15} strokeWidth={2} className="text-primary" aria-hidden />
              <p className="text-sm font-medium text-muted">
                {t("dashboard.moneyOut.exchangeRate")}:{" "}
                <span className="font-bold text-primary">
                  1 {fromCur} = {fmtRate(rate)} {gwCur}
                </span>
              </p>
            </div>

            {/* gateway + amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* payment gateway */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.moneyOut.paymentGateway")} <span className="inline text-red-500">*</span>
                </label>
                <GatewayDropdown value={gatewayId} gateways={gateways} onChange={setGatewayId} gwLogo={gwLogo} />
              </div>

              {/* amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.moneyOut.amount")} <span className="inline text-red-500">*</span>
                </label>
                <div className="flex h-11 rounded-xl border border-border bg-surface transition focus-within:border-primary">
                  <input
                    type="number"
                    min={0}
                    placeholder={t("dashboard.moneyOut.amountPlaceholder")}
                    value={rawAmount}
                    onChange={(e) => setRawAmount(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-heading outline-none placeholder:text-muted"
                  />
                  <WalletDropdown value={fromCur} wallets={wallets} onChange={setFromCur} flagUrl={flagUrl} />
                </div>
              </div>
            </div>

            {/* limit + balance row */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-xs text-muted">
                <Info size={12} strokeWidth={2} aria-hidden />
                {t("dashboard.moneyOut.limit")}:{" "}
                <span className="font-semibold text-amber-500">
                  {fmtLimit(minSender)} {fromCur} – {fmtLimit(maxSender)} {fromCur}
                </span>
              </p>
              <div className="text-right">
                <p className="text-xs text-muted">
                  {t("dashboard.moneyOut.availableBalance")}: <span className="font-semibold text-primary">{fromSym}{fromBalance.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted">
                  {t("dashboard.moneyOut.charge")}:{" "}
                  <span className="font-semibold text-amber-500">
                    {feeFixed.toFixed(2)} {gwCur} + {feePctRate}%
                  </span>
                </p>
              </div>
            </div>

            {/* submit — step 1: fetch dynamic withdraw fields */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              disabled={!canSubmit}
              loading={submit.isPending}
              onClick={onMoneyOut}
              leftIcon={<SendHorizontal size={17} strokeWidth={2.5} aria-hidden />}
            >
              {t("dashboard.moneyOut.moneyOut")}
            </Button>
          </div>
        </Panel>

        {/* summary card */}
        {summaryCard}
      </div>

      {/* ── money out logs ── */}
      <Panel>
        <PanelHeader title={t("dashboard.moneyOut.logsTitle")} badge={txns.length}>
          <div className="w-full sm:flex-1 lg:w-52 lg:flex-none">
            <Input
              type="text"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder={t("dashboard.moneyOut.searchPlaceholder")}
              leftIcon={<Search size={16} strokeWidth={2} aria-hidden />}
            />
          </div>
          <div className="w-full sm:w-40 sm:shrink-0">
            <Select
              value={logStatus}
              onChange={setLogStatus}
              options={statusOpts}
              leftIcon={<SlidersHorizontal size={15} strokeWidth={2} aria-hidden />}
              aria-label={t("dashboard.moneyOut.filter")}
            />
          </div>
        </PanelHeader>

        <div className="scroll-x">
          <table className="dash-table w-full min-w-210 border-collapse text-left">
            <thead>
              <tr className="border-b-0">
                <th className={dsx.th}>{t("dashboard.moneyOut.colTransaction")}</th>
                <th className={`${dsx.th} hidden sm:table-cell`}>{t("dashboard.moneyOut.colStatus")}</th>
                <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.moneyOut.colTransactionId")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.moneyOut.colExchangeRate")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.moneyOut.colFees")}</th>
                <th className={`${dsx.th} text-right`}>{t("dashboard.moneyOut.colAmount")}</th>
                <th className={`${dsx.th} hidden whitespace-nowrap md:table-cell`}>{t("dashboard.moneyOut.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <ArrowUpRight size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.moneyOut.noLogsTitle")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.moneyOut.noLogsDesc")}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/5 text-muted dark:bg-white/10">
                      <Search size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.moneyOut.noMatchTitle")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.moneyOut.noMatchDesc")}</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cc = log.sender_currency_code;
                  const statusText = logStatusOf(log);
                  const statusTone = logStatusToneOf(log);
                  return (
                    <tr key={log.trx_id ?? log.id} className={dsx.rowHover}>
                      <td className={dsx.td}>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <ArrowUpRight size={17} strokeWidth={2} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            <div className="whitespace-nowrap text-sm font-semibold text-heading">
                              {t("dashboard.moneyOut.moneyOut")}{" "}
                              <span className="font-medium text-muted">{t("dashboard.moneyOut.via")} {log.gateway_currency}</span>
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
                          {t("dashboard.moneyOut.totalPayable")}: {Number(log.total_payable).toFixed(2)} {cc}
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
