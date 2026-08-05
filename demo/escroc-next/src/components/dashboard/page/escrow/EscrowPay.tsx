"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, FileText, User, Package, DollarSign, Tag, Copy, Check,
  CreditCard, ShieldCheck, Percent, BadgeDollarSign, Wallet, Send, Calendar, Lock,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { formatExpiry, expiryIssue } from "@/lib/cardExpiry";
import { useApprovalPending, useApprovalSubmit, useApprovalManualConfirm, useApprovalAuthorize, useEscrowCryptoConfirm } from "@/hooks/useEscrow";

/* payment-details panel used by the manual + card steps */
function PaymentDetails({ ci }: { ci: any }) {
  const { t } = useLang();
  const rows = [
    { label: t("dashboard.createEscrow.feesCharge"), value: ci.total_charge, Icon: CreditCard, tone: "text-amber-500" },
    { label: t("dashboard.createEscrow.sellerWillGet"), value: ci.seller_get, Icon: Wallet },
    { label: t("dashboard.createEscrow.payWith"), value: ci.gateway_currency_name, Icon: ShieldCheck },
    { label: t("dashboard.createEscrow.exchangeRate"), value: ci.exchange_rate, Icon: Percent },
    { label: t("dashboard.createEscrow.youWillPay"), value: ci.payable_amount, Icon: BadgeDollarSign, strong: true },
  ];
  return (
    <Panel>
      <PanelHeader title={t("dashboard.createEscrow.paymentDetails")} />
      <div className="divide-y divide-border">
        {rows.map(({ label, value, Icon, tone, strong }) => (
          <div key={label} className={`flex items-center gap-4 px-6 py-4 ${strong ? "bg-primary/4" : ""}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
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

/* dynamic manual-gateway field */
function ManualField({ field, value, onChange }: { field: any; value: any; onChange: (name: string, v: any) => void }) {
  const { t } = useLang();
  const base = "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {field.label} {field.required ? <span className="inline text-red-500">*</span> : <span className="text-muted">{t("dashboard.common.optional")}</span>}
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

/*
 * This page is only reached by the buyer (MyEscrow only links here when
 * role === "buyer"), so `charge_payer` — an absolute buyer/seller/half value —
 * should read from that perspective: "buyer" means *I* pay, so show "Me".
 */
function chargePayerLabel(raw: string, t: (k: string) => string) {
  const v = (raw ?? "").toLowerCase();
  if (v === "buyer" || v === "me") return t("dashboard.createEscrow.whoPaysMe");
  if (v === "seller") return t("dashboard.createEscrow.whoPaysSeller");
  if (v === "half" || v === "both" || v.includes("50")) return t("dashboard.createEscrow.whoPays5050");
  return raw;
}

function SkPanel() {
  return (
    <Panel>
      <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><div className="h-4 w-32 animate-pulse rounded bg-border" /></div>
      <div className="space-y-3 p-4 sm:p-6">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-border" />)}
      </div>
    </Panel>
  );
}

/* ─────────────────────────── component ─────────────────────────── */

export function EscrowPay() {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const { data: res, isLoading } = useApprovalPending(id);
  const submit = useApprovalSubmit();
  const manualPay = useApprovalManualConfirm();
  const authorize = useApprovalAuthorize();
  const cryptoConfirm = useEscrowCryptoConfirm();

  const [manualStep, setManualStep] = useState<any | null>(null);
  const [cardStep, setCardStep] = useState<any | null>(null);
  const [cryptoStep, setCryptoStep] = useState<any | null>(null);
  const [cryptoFields, setCryptoFields] = useState<Record<string, any>>({});
  const [addrCopied, setAddrCopied] = useState(false);
  const [manualFields, setManualFields] = useState<Record<string, any>>({});
  const [card, setCard] = useState({ number: "", date: "", code: "" });
  const dateIssue = expiryIssue(card.date);

  const d = (res as any)?.data;
  const info = d?.escrow_information ?? {};
  const wallets: any[] = Array.isArray(d?.user_wallet) ? d.user_wallet : [];
  const gateways: any[] = Array.isArray(d?.gateway_currencies) ? d.gateway_currencies : [];

  const [payWith, setPayWith] = useState("myWallet");

  const defWallet = wallets.find((w) => w.default === 1) ?? wallets[0];
  const payOpts: SelectOption[] = [
    {
      value: "myWallet",
      label: t("dashboard.createEscrow.myWallet"),
      sub: defWallet ? `${defWallet.currency_symbol}${Number(defWallet.balance).toLocaleString()} ${defWallet.currency_code}` : "",
      icon: <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Wallet size={15} strokeWidth={2} aria-hidden /></span>,
    },
    ...gateways.map((g) => ({ value: String(g.id), label: g.name, sub: g.type })),
  ];
  const payWithLabel = payOpts.find((o) => o.value === payWith)?.label ?? "—";

  const detailRows = [
    { label: t("dashboard.createEscrow.pTitle"), value: info.title, Icon: FileText },
    { label: t("dashboard.createEscrow.pRole"), value: info.role ?? info.my_role, Icon: User, cap: true },
    { label: t("dashboard.createEscrow.pType"), value: info.category, Icon: Package },
    { label: t("dashboard.createEscrow.pTotal"), value: info.amount ?? info.total_amount, Icon: DollarSign, strong: true },
    { label: t("dashboard.createEscrow.pCharge"), value: chargePayerLabel(info.charge_payer, t), Icon: Tag },
  ];
  const payRows = [
    { label: t("dashboard.createEscrow.feesCharge"), value: info.total_charge ?? info.fee, Icon: CreditCard, tone: "text-amber-500" },
    { label: t("dashboard.createEscrow.payWith"), value: payWithLabel, Icon: ShieldCheck },
    { label: t("dashboard.createEscrow.exchangeRate"), value: info.exchange_rate, Icon: Percent },
    { label: t("dashboard.createEscrow.youWillPay"), value: info.payable_amount ?? info.buyer_amount ?? info.amount, Icon: BadgeDollarSign, strong: true },
  ];

  const onPay = () => {
    if (!id) return;
    // Hosted (WEB) gateways redirect the browser back to these pages after payment.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    submit.mutate(
      {
        id,
        payment_gateway: payWith,
        source: "WEB",
        success_url: `${origin}/dashboard/escrow/success`,
        cancel_url: `${origin}/dashboard/escrow/cancel`,
      },
      {
        onSuccess: (r) => {
          const rinfo = (r as any)?.data;
          if (rinfo?.action_type === "CRYPTO_NATIVE" && rinfo?.address_info) {
            const init: Record<string, any> = {};
            (rinfo.address_info.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
            setCryptoFields(init);
            setCryptoStep(rinfo);
          } else if (rinfo?.gategay_type === "MANUAL") {
            const init: Record<string, any> = {};
            (rinfo.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
            setManualFields(init);
            setManualStep(rinfo);
          } else if (/authorize/i.test(rinfo?.identify ?? "")) {
            setCardStep(rinfo);
          } else if (rinfo?.gategay_type === "AUTOMATIC") {
            const u = rinfo.url;
            const url = Array.isArray(u) ? (u.find((l: any) => l?.rel === "approve")?.href ?? u[0]?.href) : u;
            if (url) { window.location.href = url; return; }
            router.push("/dashboard/escrow");
          } else {
            router.push("/dashboard/escrow");
          }
        },
      },
    );
  };

  const setManualField = (name: string, v: any) => setManualFields((p) => ({ ...p, [name]: v }));
  const manualValid = (manualStep?.input_fields ?? []).every((f: any) => !f.required || manualFields[f.name]);
  const onManualPay = () => {
    const trx = manualStep?.payment_informations?.trx;
    if (trx) manualPay.mutate({ trx, fields: manualFields });
  };
  const onCardPay = () => {
    const trx = cardStep?.payment_informations?.trx;
    if (trx) authorize.mutate({ trx, card_number: card.number, date: card.date, code: card.code });
  };

  // ── native-crypto step (address + QR + txn-hash) ──
  const setCryptoField = (name: string, v: any) => setCryptoFields((p) => ({ ...p, [name]: v }));
  const cryptoValid = (cryptoStep?.address_info?.input_fields ?? []).every((f: any) => !f.required || cryptoFields[f.name]);
  const onCryptoProceed = () => {
    const submitUrl = cryptoStep?.address_info?.submit_url;
    if (submitUrl) cryptoConfirm.mutate({ submitUrl, fields: cryptoFields });
  };
  const copyAddress = () => {
    navigator.clipboard?.writeText(cryptoStep?.address_info?.address ?? "");
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2000);
  };

  // ── Native-crypto step — pay to address, submit txn hash ──
  if (cryptoStep) {
    const addr = cryptoStep.address_info ?? {};
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-black tracking-tight text-heading">
          {t("dashboard.createEscrow.manualPayment")} ( {cryptoStep.gateway_currency_name ?? cryptoStep.identify} )
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
          <PaymentDetails ci={cryptoStep.payment_informations ?? {}} />
        </div>
      </div>
    );
  }

  // ── Manual gateway step ──
  if (manualStep) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-black tracking-tight text-heading">
          {t("dashboard.createEscrow.manualPayment")} ( {manualStep.identify} )
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.manualInstrTitle")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <p className="text-sm font-semibold text-heading">{t("dashboard.createEscrow.manualInstrDesc")}</p>
              {(manualStep.input_fields ?? []).map((f: any) => (
                <ManualField key={f.name} field={f} value={manualFields[f.name]} onChange={setManualField} />
              ))}
            </div>
          </Panel>
          <PaymentDetails ci={manualStep.payment_informations ?? {}} />
        </div>
        <Button type="button" variant="primary" size="lg" fullWidth disabled={!manualValid} loading={manualPay.isPending} onClick={onManualPay} leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}>
          {t("dashboard.createEscrow.confirmPay")}
        </Button>
      </div>
    );
  }

  // ── Card gateway step (Authorize) ──
  if (cardStep) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-black tracking-tight text-heading">{t("dashboard.createEscrow.authTitle")}</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.payWithCard")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.cardNumber")} <span className="inline text-red-500">*</span>
                </label>
                <div className="relative">
                  <input inputMode="numeric" value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d]/g, "").slice(0, 19) }))}
                    placeholder="1234 1234 1234 1234"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-4 pr-12 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary" />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"><CreditCard size={18} strokeWidth={2} aria-hidden /></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">{t("dashboard.createEscrow.expDate")} <span className="inline text-red-500">*</span></label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Calendar size={16} strokeWidth={2} aria-hidden /></span>
                    <input inputMode="numeric" value={card.date} onChange={(e) => setCard((c) => ({ ...c, date: formatExpiry(e.target.value) }))} placeholder="YY / MM" maxLength={5}
                      className={`h-11 w-full rounded-xl border bg-surface pl-11 pr-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary ${dateIssue ? "border-rose-500" : "border-border"}`} />
                  </div>
                  {dateIssue && (
                    <p className="text-xs text-rose-500">
                      {dateIssue === "month" ? t("dashboard.createEscrow.expDateMonthError") : t("dashboard.createEscrow.expDateError")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">{t("dashboard.createEscrow.cvc")} <span className="inline text-red-500">*</span></label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Lock size={16} strokeWidth={2} aria-hidden /></span>
                    <input inputMode="numeric" value={card.code}
                      onChange={(e) => setCard((c) => ({ ...c, code: e.target.value.replace(/[^\d]/g, "").slice(0, 4) }))} placeholder="CVC"
                      className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary" />
                  </div>
                </div>
              </div>
              <Button type="button" variant="primary" size="lg" fullWidth disabled={!card.number || !card.date || !card.code || !!dateIssue} loading={authorize.isPending} onClick={onCardPay} leftIcon={<Lock size={16} strokeWidth={2.5} aria-hidden />}>
                {t("dashboard.createEscrow.submitPayment")}
              </Button>
            </div>
          </Panel>
          <PaymentDetails ci={cardStep.payment_informations ?? {}} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.push("/dashboard/escrow")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition hover:text-heading"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        {t("dashboard.createEscrow.backToMyEscrow")}
      </button>

      {isLoading && !d ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><SkPanel /><SkPanel /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* escrow details */}
            <Panel>
              <PanelHeader title={t("dashboard.createEscrow.escrowDetails")} />
              <div className="divide-y divide-border">
                {detailRows.map(({ label, value, Icon, cap, strong }) => (
                  <div key={label} className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <Icon size={16} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="flex-1 text-sm text-muted">{label}</span>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${strong ? "text-primary" : "text-heading"} ${cap ? "capitalize" : ""}`}>{value}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* payment details */}
            <Panel>
              <PanelHeader title={t("dashboard.createEscrow.paymentDetails")} />
              <div className="divide-y divide-border">
                {payRows.map(({ label, value, Icon, tone, strong }) => (
                  <div key={label} className={`flex items-center gap-4 px-6 py-4 ${strong ? "bg-primary/4" : ""}`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <Icon size={16} strokeWidth={2} aria-hidden />
                    </span>
                    <span className={`flex-1 text-sm ${strong ? "font-bold text-heading" : "text-muted"}`}>{label}</span>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${tone ?? (strong ? "text-primary" : "text-heading")}`}>{value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* pay with */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("dashboard.createEscrow.payWith")} <span className="inline text-red-500">*</span>
            </label>
            <Select value={payWith} onChange={setPayWith} options={payOpts} />
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={submit.isPending}
            onClick={onPay}
            leftIcon={<Send size={17} strokeWidth={2.5} aria-hidden />}
          >
            {t("dashboard.createEscrow.confirmPay")}
          </Button>
        </>
      )}
    </div>
  );
}
