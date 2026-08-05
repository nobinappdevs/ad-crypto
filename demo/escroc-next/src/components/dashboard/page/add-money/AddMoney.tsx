"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  SlidersHorizontal,
  Wallet,
  RefreshCw,
  Percent,
  BadgeDollarSign,
  Info,
  CreditCard,
  ShieldCheck,
  Calendar,
  Lock,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Panel, PanelHeader, StatusBadge, TableFooter, dsx } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { formatExpiry, expiryIssue } from "@/lib/cardExpiry";
import { useAddMoney, useSubmitAddMoney, useAddMoneyManualConfirm, useAddMoneyAuthorize, useAddMoneyCryptoConfirm } from "@/hooks/useAddMoney";

const fmtRate = (r: number) =>
  r >= 1 ? r.toFixed(3) : r >= 0.001 ? r.toFixed(4) : r.toPrecision(3);

// ISO → "YYYY-MM-DD HH:mm" without locale (keeps SSR/client output identical).
const fmtTxnDate = (iso?: string) => (iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "—");

/* status-filter options for the deposit log */
const STATUS_OPTS: SelectOption[] = [
  { value: "", label: "dashboard.status.all" },
  { value: "Success", label: "dashboard.status.success" },
  { value: "Pending", label: "dashboard.status.pending" },
  { value: "Waiting", label: "dashboard.status.waiting" },
  { value: "Rejected", label: "dashboard.status.rejected" },
];

/* numeric add-money status → i18n key + StatusBadge tone
   (1 SUCCESS, 2 PENDING, 3 HOLD, 4 REJECTED, 5 WAITING, 6 FAILED) */
const TXN_STATUS: Record<number, { key: string; tone: string }> = {
  1: { key: "dashboard.status.success", tone: "success" },
  2: { key: "dashboard.status.pending", tone: "pending" },
  3: { key: "dashboard.status.hold", tone: "pending" },
  4: { key: "dashboard.status.rejected", tone: "danger" },
  5: { key: "dashboard.status.waiting", tone: "info" },
  6: { key: "dashboard.status.failed", tone: "danger" },
};

/* status that means "awaiting the crypto payment" → show the crypto address button */
const CRYPTO_WAITING_STATUS = 5;

/* string_status → StatusBadge tone */
function logStatusTone(status: string) {
  const s = (status ?? "").toLowerCase();
  if (/success|complete|approved|paid|released/.test(s)) return "success";
  if (/pending|process/.test(s)) return "pending";
  if (/wait/.test(s)) return "info";
  if (/reject|fail|cancel|declin|disput/.test(s)) return "danger";
  return "neutral";
}

/* ── wallet currency chip (amount right side) ── */
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

/* ── payment gateway (full-width) ── */
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

/* ── payment-details panel (manual/card steps, from server payment_informations) ── */
function PaymentInfo({ ci, title }: { ci: any; title?: string }) {
  const { t } = useLang();
  const rows = [
    { label: t("dashboard.addMoney.requestAmount"), value: ci.request_amount, Icon: Wallet },
    { label: t("dashboard.addMoney.exchangeRateLabel"), value: ci.exchange_rate, Icon: RefreshCw },
    { label: t("dashboard.addMoney.willGet"), value: ci.will_get, Icon: ArrowLeftRight },
    { label: t("dashboard.addMoney.totalFees"), value: ci.total_charge, Icon: Percent, tone: "text-amber-500" },
    { label: t("dashboard.addMoney.totalPayable"), value: ci.payable_amount, Icon: BadgeDollarSign, strong: true },
  ];
  return (
    <Panel>
      <PanelHeader title={title ?? t("dashboard.addMoney.summary")} />
      <div className="divide-y divide-border">
        {rows.map(({ label, value, Icon, tone, strong }) => (
          <div key={label} className={`flex items-center gap-4 px-6 py-4 ${strong ? "bg-primary/4" : ""}`}>
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${strong ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-surface text-muted"}`}>
              <Icon size={16} strokeWidth={2} aria-hidden />
            </span>
            <span className={`flex-1 text-sm ${strong ? "font-bold text-heading" : "text-muted"}`}>{label}</span>
            <span className={`shrink-0 text-sm font-bold tabular-nums ${tone ?? (strong ? "text-primary" : "text-heading")}`}>{value}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── dynamic manual-gateway field (file / text / number) ── */
function ManualField({ field, value, onChange }: { field: any; value: any; onChange: (name: string, v: any) => void }) {
  const { t } = useLang();
  const base = "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {field.label} {field.required ? <span className="inline text-red-500">*</span> : <span className="normal-case text-muted">{t("dashboard.common.optional")}</span>}
      </label>
      {field.type === "file" ? (
        <input
          type="file"
          required={field.required}
          accept={(field.validation?.mimes ?? []).map((m: string) => `.${m}`).join(",")}
          onChange={(e) => onChange(field.name, e.target.files?.[0] ?? null)}
          className="w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary focus:border-primary"
        />
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={value ?? ""}
          required={field.required}
          placeholder={field.placeholder ?? field.label}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── loading skeleton ─────────────────────────── */

function SkLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

function AddMoneySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
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
            {Array.from({ length: 4 }).map((_, i) => (
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

export function AddMoney() {
  const { t } = useLang();

  const statusOpts: SelectOption[] = STATUS_OPTS.map((o) => ({ ...o, label: t(o.label) }));

  const SUMMARY_ROWS = [
    { key: "entered",    labelKey: "dashboard.addMoney.enteredAmount",    Icon: Wallet },
    { key: "conversion", labelKey: "dashboard.addMoney.conversionAmount", Icon: ArrowLeftRight },
    { key: "fees",       labelKey: "dashboard.addMoney.totalFees",        Icon: Percent },
    { key: "payable",    labelKey: "dashboard.addMoney.totalPayable",     Icon: BadgeDollarSign },
  ];

  const { data: res, isLoading } = useAddMoney();
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
  const payable   = +(converted + totalFees).toFixed(2); // deposits add fees on top of the converted amount

  const fromSym = fromWallet?.currency_symbol ?? "";
  const fromBalance = fromWallet?.balance ?? 0;

  const fmt = (n: number, cur: string) => (n > 0 ? `${n.toLocaleString()} ${cur}` : "—");

  const summaryValues: Record<string, string> = {
    entered:    fmt(amount, fromCur),
    conversion: fmt(converted, gwCur),
    fees:       fmt(totalFees, gwCur),
    payable:    fmt(payable, gwCur),
  };

  // Gateway limits are in the gateway currency, so compare the converted amount.
  const min = Number(gw?.min_limit ?? 0);
  const max = Number(gw?.max_limit ?? 0);
  const canSubmit = amount > 0 && converted >= min && converted <= max;

  // The limit is shown in the wallet (sender) currency the user is typing in —
  // convert the gateway-currency limit back through the rate (1 fromCur = rate gwCur).
  const fmtLimit = (n: number) => n.toFixed(3);
  const minSender = rate ? min / rate : min;
  const maxSender = rate ? max / rate : max;

  // ── submit — routes by gateway type. AUTOMATIC+GET → hosted checkout URL;
  //    MANUAL → in-app proof form. Authorize (card) will be wired next.
  const submit = useSubmitAddMoney();
  const manualConfirm = useAddMoneyManualConfirm();
  const authorize = useAddMoneyAuthorize();
  const cryptoConfirm = useAddMoneyCryptoConfirm();
  const [manualStep, setManualStep] = useState<any | null>(null);
  const [manualFields, setManualFields] = useState<Record<string, any>>({});
  const [cardStep, setCardStep] = useState<any | null>(null);
  const [cryptoStep, setCryptoStep] = useState<any | null>(null);
  const [cryptoFields, setCryptoFields] = useState<Record<string, any>>({});
  const [addrCopied, setAddrCopied] = useState(false);
  const [card, setCard] = useState({ number: "", date: "", code: "" });
  const dateIssue = expiryIssue(card.date);

  // Deposit-log search + status filter (client-side over the loaded rows).
  const [logQuery, setLogQuery] = useState("");
  const [logStatus, setLogStatus] = useState("");
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

  const onAddMoney = () => {
    if (!gw) return;
    // Hosted (WEB) gateways redirect the browser back to these pages after payment.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    submit.mutate(
      {
        gateway_currency: gw.alias,
        sender_currency: fromCur,
        amount,
        source: "WEB",
        success_url: `${origin}/dashboard/add-money/success`,
        cancel_url: `${origin}/dashboard/add-money/cancel`,
      },
      {
        onSuccess: (res) => {
          const info = (res as any)?.data;
          const type = info?.gategay_type ?? info?.gateway_type;
          const method = String(info?.method).toLowerCase();
          if (info?.action_type === "CRYPTO_NATIVE" && info?.address_info) {
            const init: Record<string, any> = {};
            (info.address_info.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
            setCryptoFields(init);
            setCryptoStep(info);
          } else if (type === "MANUAL") {
            const init: Record<string, any> = {};
            (info.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
            setManualFields(init);
            setManualStep(info);
          } else if (type === "AUTOMATIC" && method === "post") {
            // Authorize (card) gateway — pays via an in-app card form, not a redirect.
            setCardStep(info);
          } else if (type === "AUTOMATIC" && method === "get") {
            const u = info.url;
            const redirectUrl = Array.isArray(u)
              ? (u.find((l: any) => l?.rel === "approve")?.href ?? u[0]?.href)
              : u;
            if (redirectUrl) window.location.href = redirectUrl;
          }
        },
      },
    );
  };

  const setManualField = (name: string, v: any) => setManualFields((p) => ({ ...p, [name]: v }));
  const manualValid = (manualStep?.input_fields ?? []).every((f: any) => !f.required || manualFields[f.name]);
  const onManualPay = () => {
    const trx = manualStep?.payment_informations?.trx;
    if (!trx) return;
    manualConfirm.mutate(
      { trx, fields: manualFields },
      { onSuccess: () => { setManualStep(null); setRawAmount(""); } },
    );
  };

  const onCardPay = () => {
    const trx = cardStep?.payment_informations?.trx;
    if (!trx) return;
    authorize.mutate(
      { trx, card_number: card.number, date: card.date, code: card.code },
      { onSuccess: () => { setCardStep(null); setCard({ number: "", date: "", code: "" }); setRawAmount(""); } },
    );
  };

  // ── native-crypto step (address + QR + txn-hash) ──
  const setCryptoField = (name: string, v: any) => setCryptoFields((p) => ({ ...p, [name]: v }));
  const cryptoValid = (cryptoStep?.address_info?.input_fields ?? []).every((f: any) => !f.required || cryptoFields[f.name]);
  const onCryptoProceed = () => {
    const submitUrl = cryptoStep?.address_info?.submit_url;
    if (!submitUrl) return;
    cryptoConfirm.mutate(
      { submitUrl, fields: cryptoFields },
      { onSuccess: () => { setCryptoStep(null); setRawAmount(""); } },
    );
  };
  const copyAddress = () => {
    navigator.clipboard?.writeText(cryptoStep?.address_info?.address ?? "");
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2000);
  };

  // Skeleton on first load.
  if (isLoading && !d) return <AddMoneySkeleton />;

  // ── Native-crypto step — pay to address, submit txn hash ──
  if (cryptoStep) {
    const addr = cryptoStep.address_info ?? {};
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-black tracking-tight text-heading">
          {t("dashboard.addMoney.manualTitle")} ( {cryptoStep.gateway_currency_name} )
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.cryptoAddressTitle")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
                <input
                  readOnly
                  value={addr.address ?? ""}
                  className="min-w-0 flex-1 cursor-default bg-transparent px-4 font-mono text-sm text-heading outline-none"
                />
                <button
                  type="button"
                  onClick={copyAddress}
                  aria-label={addrCopied ? t("dashboard.createEscrow.copied") : t("dashboard.createEscrow.copyAddress")}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-l border-border px-4 text-sm font-semibold transition ${addrCopied ? "bg-primary/10 text-primary" : "bg-surface text-muted hover:bg-primary/10 hover:text-primary"}`}
                >
                  {addrCopied ? <Check size={15} strokeWidth={2.5} aria-hidden /> : <Copy size={15} strokeWidth={2} aria-hidden />}
                </button>
              </div>

              {addr.address && (
                <div className="flex justify-center">
                  <div className="w-full max-w-63 rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
                    <QRCodeSVG value={String(addr.address)} size={220} className="h-auto w-full" />
                  </div>
                </div>
              )}

              {(addr.input_fields ?? []).map((f: any) => (
                <ManualField key={f.name} field={f} value={cryptoFields[f.name]} onChange={setCryptoField} />
              ))}

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!cryptoValid}
                loading={cryptoConfirm.isPending}
                onClick={onCryptoProceed}
                leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.createEscrow.cryptoProceed")}
              </Button>
            </div>
          </Panel>
          <PaymentInfo ci={cryptoStep.payment_informations ?? {}} />
        </div>
      </div>
    );
  }

  // ── Manual gateway step — dynamic proof form + server payment details ──
  if (manualStep) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-black tracking-tight text-heading">
          {t("dashboard.addMoney.manualTitle")} ( {manualStep.gateway_currency_name} )
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader title={t("dashboard.addMoney.manualInstrTitle")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              {manualStep.details && (
                <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium leading-relaxed text-primary">
                  {manualStep.details}
                </p>
              )}
              {(manualStep.input_fields ?? []).map((f: any) => (
                <ManualField key={f.name} field={f} value={manualFields[f.name]} onChange={setManualField} />
              ))}
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!manualValid}
                loading={manualConfirm.isPending}
                onClick={onManualPay}
                leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.addMoney.confirmPayment")}
              </Button>
            </div>
          </Panel>
          <PaymentInfo ci={manualStep.payment_informations ?? {}} />
        </div>
      </div>
    );
  }

  // ── Authorize (card) gateway step — POST /add-money/authorize-payment-submit ──
  if (cardStep) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-black tracking-tight text-heading">{t("dashboard.addMoney.authTitle")}</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* card form */}
          <Panel>
            <PanelHeader title={t("dashboard.addMoney.payWithCard")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.addMoney.cardNumber")} <span className="inline text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    inputMode="numeric"
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d]/g, "").slice(0, 19) }))}
                    placeholder="1234 1234 1234 1234"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-4 pr-12 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"><CreditCard size={18} strokeWidth={2} aria-hidden /></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("dashboard.addMoney.expDate")} <span className="inline text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Calendar size={16} strokeWidth={2} aria-hidden /></span>
                    <input
                      inputMode="numeric"
                      value={card.date}
                      onChange={(e) => setCard((c) => ({ ...c, date: formatExpiry(e.target.value) }))}
                      placeholder="YY / MM"
                      maxLength={5}
                      className={`h-11 w-full rounded-xl border bg-surface pl-11 pr-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary ${dateIssue ? "border-rose-500" : "border-border"}`}
                    />
                  </div>
                  {dateIssue && (
                    <p className="text-xs text-rose-500">
                      {dateIssue === "month" ? t("dashboard.addMoney.expDateMonthError") : t("dashboard.addMoney.expDateError")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("dashboard.addMoney.cvc")} <span className="inline text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Lock size={16} strokeWidth={2} aria-hidden /></span>
                    <input
                      inputMode="numeric"
                      value={card.code}
                      onChange={(e) => setCard((c) => ({ ...c, code: e.target.value.replace(/[^\d]/g, "").slice(0, 4) }))}
                      placeholder="CVC"
                      className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!card.number || !card.date || !card.code || !!dateIssue}
                loading={authorize.isPending}
                onClick={onCardPay}
                leftIcon={<Lock size={16} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.addMoney.submitPayment")}
              </Button>
            </div>
          </Panel>

          {/* payment information */}
          <PaymentInfo ci={cardStep.payment_informations ?? {}} title={t("dashboard.addMoney.paymentInformation")} />
        </div>
      </div>
    );
  }

  if (!gw || !fromWallet) return <AddMoneySkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* ── top: form + summary ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* form card */}
        <Panel>
          <PanelHeader title={t("dashboard.addMoney.title")}>
            <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <CreditCard size={13} strokeWidth={2.5} aria-hidden />
              {t("dashboard.addMoney.depositFunds")}
            </span>
          </PanelHeader>

          <div className="p-4 sm:p-6">
            {/* exchange rate strip */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-center">
              <RefreshCw size={15} strokeWidth={2} className="text-primary" aria-hidden />
              <p className="text-sm font-medium text-muted">
                {t("dashboard.addMoney.exchangeRate")}{" "}
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
                  {t("dashboard.addMoney.paymentGateway")} <span className="inline text-red-500">*</span>
                </label>
                <GatewayDropdown value={gatewayId} gateways={gateways} onChange={setGatewayId} gwLogo={gwLogo} />
              </div>

              {/* amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.addMoney.amount")} <span className="inline text-red-500">*</span>
                </label>
                <div className="flex h-11 rounded-xl border border-border bg-surface transition focus-within:border-primary">
                  <input
                    type="number"
                    min={0}
                    placeholder={t("dashboard.addMoney.enterAmount")}
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
                {t("dashboard.addMoney.limit")}{" "}
                <span className="font-semibold text-amber-500">
                  {fmtLimit(minSender)} {fromCur} – {fmtLimit(maxSender)} {fromCur}
                </span>
              </p>
              <div className="text-right">
                <p className="text-xs text-muted">
                  {t("dashboard.addMoney.availableBalance")} <span className="font-semibold text-primary">{fromSym}{fromBalance.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted">
                  {t("dashboard.addMoney.charge")}{" "}
                  <span className="font-semibold text-amber-500">
                    {feeFixed.toFixed(2)} {gwCur} + {feePctRate}%
                  </span>
                </p>
              </div>
            </div>

            {/* submit */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              disabled={!canSubmit}
              loading={submit.isPending}
              onClick={onAddMoney}
              leftIcon={<Wallet size={17} strokeWidth={2.5} aria-hidden />}
            >
              {t("dashboard.addMoney.addMoneyBtn")}
            </Button>
          </div>
        </Panel>

        {/* summary card */}
        <Panel>
          <PanelHeader title={t("dashboard.addMoney.summary")} />
          <div className="divide-y divide-border">
            {SUMMARY_ROWS.map(({ key, labelKey, Icon }, i) => {
              const isLast = i === SUMMARY_ROWS.length - 1;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-4 px-6 py-4 transition hover:bg-black/2 dark:hover:bg-white/2 ${isLast ? "bg-primary/4" : ""}`}
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${
                      isLast
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${isLast ? "text-primary" : "text-muted"}`}>{t(labelKey)}</p>
                  </div>
                  <p className={`shrink-0 whitespace-nowrap text-sm font-bold tabular-nums ${isLast ? "text-primary" : "text-heading"}`}>
                    {summaryValues[key]}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3.5 sm:px-6 sm:py-4">
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
              <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
              {t("dashboard.addMoney.infoNote")}
            </p>
          </div>
        </Panel>
      </div>

      {/* ── add money log ── */}
      <Panel>
        <PanelHeader title={t("dashboard.addMoney.logTitle")} badge={txns.length}>
          <div className="w-full sm:flex-1 lg:w-52 lg:flex-none">
            <Input
              type="text"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder={t("dashboard.addMoney.searchLogs")}
              leftIcon={<Search size={16} strokeWidth={2} aria-hidden />}
            />
          </div>
          <div className="w-full sm:w-40 sm:shrink-0">
            <Select
              value={logStatus}
              onChange={setLogStatus}
              options={statusOpts}
              leftIcon={<SlidersHorizontal size={15} strokeWidth={2} aria-hidden />}
              aria-label={t("dashboard.addMoney.filter")}
            />
          </div>
        </PanelHeader>

        <div className="scroll-x">
          <table className="dash-table w-full min-w-210 border-collapse text-left">
            <thead>
              <tr className="border-b-0">
                <th className={dsx.th}>{t("dashboard.addMoney.colTransaction")}</th>
                <th className={`${dsx.th} hidden sm:table-cell`}>{t("dashboard.addMoney.colStatus")}</th>
                <th className={`${dsx.th} hidden md:table-cell`}>{t("dashboard.addMoney.colTransactionId")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.addMoney.colExchangeRate")}</th>
                <th className={`${dsx.th} hidden lg:table-cell`}>{t("dashboard.addMoney.colFeesCharge")}</th>
                <th className={`${dsx.th} text-right`}>{t("dashboard.addMoney.colAmount")}</th>
                <th className={`${dsx.th} hidden whitespace-nowrap md:table-cell`}>{t("dashboard.addMoney.colDate")}</th>
                <th className={`${dsx.th} w-px`} aria-label={t("dashboard.myEscrow.colActions")} />
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                      <ArrowUpRight size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.addMoney.noLogsTitle")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.addMoney.noLogsDesc")}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/5 text-muted dark:bg-white/10">
                      <Search size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-heading">{t("dashboard.addMoney.noMatchTitle")}</p>
                    <p className="mt-1 text-xs text-muted">{t("dashboard.addMoney.noMatchDesc")}</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cc = log.sender_currency_code;
                  const statusText = logStatusOf(log);
                  const statusTone = logStatusToneOf(log);
                  const showCrypto = Number(log.status) === CRYPTO_WAITING_STATUS; // WAITING
                  return (
                    <tr key={log.trx_id ?? log.id} className={dsx.rowHover}>
                      <td className={dsx.td}>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <ArrowUpRight size={17} strokeWidth={2} aria-hidden />
                          </div>
                          <div className="min-w-0">
                            {/* nowrap — otherwise auto table-layout squeezes this
                                column and wraps the label over several lines */}
                            <div className="whitespace-nowrap text-sm font-semibold text-heading">
                              {t("dashboard.addMoney.addBalance")}{" "}
                              <span className="font-medium text-muted">{t("dashboard.addMoney.via")} {log.gateway_currency}</span>
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
                          {t("dashboard.addMoney.totalPayable")}: {Number(log.total_payable).toFixed(2)} {cc}
                        </div>
                      </td>
                      <td className={`${dsx.td} hidden whitespace-nowrap text-sm text-muted md:table-cell`}>
                        {fmtTxnDate(log.created_at)}
                      </td>
                      <td className={`${dsx.td} w-px`}>
                        {showCrypto && (
                          <Link
                            href={`/dashboard/add-money/crypto-address?trx=${log.trx_id}`}
                            aria-label={t("dashboard.createEscrow.cryptoAddressTitle")}
                            className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-500/70 text-white shadow-sm shadow-amber-500/30 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-500/40 active:translate-y-0"
                          >
                            <QrCode size={16} strokeWidth={2} aria-hidden className="transition-transform group-hover:scale-110" />
                          </Link>
                        )}
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
