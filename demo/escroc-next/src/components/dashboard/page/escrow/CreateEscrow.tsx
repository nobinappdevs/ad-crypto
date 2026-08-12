"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  Package,
  FileText,
  Check,
  Copy,
  X,
  Loader2,
  Info,
  Wallet,
  BadgeDollarSign,
  Percent,
  ShoppingBag,
  Store,
  User,
  Tag,
  CreditCard,
  Send,
  DollarSign,
  Calendar,
  Lock,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { useEscrowCreateInfo, useUserCheck, useSubmitEscrow, useConfirmEscrow, useAuthorizePayment, useManualPaymentConfirm, useEscrowCryptoConfirm } from "@/hooks/useEscrow";
import { useKycGate } from "@/hooks/useKyc";
import { formatExpiry, expiryIssue } from "@/lib/cardExpiry";

const FEE_PCT = 2; // display-only estimate

type Opt = SelectOption;

/* ─────────────────────────── currency dropdown ─────────────────────────── */

/* compact currency selector (sits inside the amount field) */
function CurrencyDropdown({ value, onChange, wallets, flagUrl }: {
  value: string; onChange: (v: string) => void; wallets: any[]; flagUrl: (w: any) => string;
}) {
  const { t } = useLang();
  const options: SelectOption[] = wallets.map((w) => ({
    value: w.currency_code,
    label: w.currency_code,
    badge: w.currency_type,
    sub: w.name,
    image: flagUrl(w) || undefined,
    imageFallback: <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{w.currency_symbol}</span>,
    keywords: `${w.currency_code} ${w.name} ${w.currency_type}`,
  }));
  return <Select variant="chip" value={value} onChange={onChange} options={options} placeholder="—" aria-label={t("dashboard.common.currency")} />;
}

/* shared payment-details panel (card + manual steps) */
function PaymentDetails({ ci }: { ci: any }) {
  const { t } = useLang();
  const rows = [
    { label: t("dashboard.createEscrow.feesCharge"), value: ci.total_charge, Icon: CreditCard, tone: "text-amber-500" },
    { label: t("dashboard.createEscrow.sellerWillGet"), value: ci.seller_get, Icon: Wallet },
    { label: t("dashboard.createEscrow.payWith"), value: ci.gateway_currency_name, Icon: ShieldCheck },
    { label: t("dashboard.createEscrow.exchangeRate"), value: ci.exchange_rate, Icon: Percent },
    { label: t("dashboard.createEscrow.buyerWillPay"), value: ci.payable_amount, Icon: BadgeDollarSign, strong: true },
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

/* dynamic manual-gateway field (file / text / select / number) */
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

/* ─────────────────────────── component ─────────────────────────── */

export function CreateEscrow() {
  const { t } = useLang();

  const { data: res } = useEscrowCreateInfo();
  const info = (res as any)?.data;
  const categories: any[] = info?.escrow_categories ?? [];
  const wallets: any[] = info?.user_wallet ?? [];
  const gateways: any[] = info?.gateway_currencies ?? [];
  const baseUrl: string = info?.base_url ?? "";
  const flagUrl = (w: any) => (w?.flag ? `${baseUrl}${w.image_path}/${w.flag}` : "");

  const ROLES = [
    { id: "buyer",  label: t("dashboard.createEscrow.roleBuyerLabel"),  desc: t("dashboard.createEscrow.roleBuyerDesc"),  Icon: ShoppingBag },
    { id: "seller", label: t("dashboard.createEscrow.roleSellerLabel"), desc: t("dashboard.createEscrow.roleSellerDesc"), Icon: Store },
  ];

  const [role, setRole] = useState("buyer");
  const [category, setCategory] = useState<string>("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState("");
  const [rawAmount, setRawAmount] = useState("");
  const [whoPays, setWhoPays] = useState("me");
  const [payWith, setPayWith] = useState("myWallet");
  const [remarks, setRemarks] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Pre-fill from the homepage banner's quick-form (carried in the URL query).
  // useSearchParams is reactive, so this applies on client-side navigation too
  // (not just a hard reload); we apply once via the render-phase state pattern.
  const searchParams = useSearchParams();
  const [prefilled, setPrefilled] = useState(false);
  if (!prefilled && searchParams) {
    setPrefilled(true);
    const pRole = searchParams.get("role");
    const pTitle = searchParams.get("title");
    const pAmount = searchParams.get("amount");
    const pCurrency = searchParams.get("escrow_currency");
    if (pRole === "buyer" || pRole === "seller") setRole(pRole);
    if (pTitle) setTitle(pTitle);
    if (pAmount) setRawAmount(pAmount);
    if (pCurrency) setCurrency(pCurrency);
  }

  // Seed defaults once loaded — currency uses the wallet flagged default:1,
  // unless the banner already supplied one via the URL.
  const [seeded, setSeeded] = useState(false);
  if (!seeded && (categories.length || wallets.length)) {
    setSeeded(true);
    if (categories[0]) setCategory(String(categories[0].id));
    const def = wallets.find((w) => w.default === 1) ?? wallets[0];
    if (def && !currency) setCurrency(def.currency_code);
  }

  // Counterparty email validation (GET user-check).
  const userCheck = useUserCheck();
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const checkEmail = () => {
    if (!email.includes("@")) { setEmailValid(null); return; }
    userCheck.mutate(email, {
      onSuccess: (r) => setEmailValid(!!r?.data?.user_check),
      onError: () => setEmailValid(false),
    });
  };

  const router = useRouter();
  const kycGate = useKycGate();
  const submit = useSubmitEscrow();
  const confirm = useConfirmEscrow();
  const authorize = useAuthorizePayment();
  const manualPay = useManualPaymentConfirm();
  const cryptoConfirm = useEscrowCryptoConfirm();
  const [preview, setPreview] = useState<any | null>(null);
  const [cardStep, setCardStep] = useState<any | null>(null);
  const [manualStep, setManualStep] = useState<any | null>(null);
  const [cryptoStep, setCryptoStep] = useState<any | null>(null);
  const [cryptoFields, setCryptoFields] = useState<Record<string, any>>({});
  const [addrCopied, setAddrCopied] = useState(false);
  const [card, setCard] = useState({ number: "", date: "", code: "" });
  const dateIssue = expiryIssue(card.date);
  const [manualFields, setManualFields] = useState<Record<string, any>>({});

  // Preview → confirm. Route by gateway: crypto → address+QR, MANUAL → manual form, Authorize → card, else redirect.
  const onConfirm = () => {
    const trx = preview?.escrow_information?.trx;
    if (!trx) return;
    confirm.mutate(trx, {
      onSuccess: (res) => {
        const info = (res as any)?.data;
        if (info?.action_type === "CRYPTO_NATIVE" && info?.address_info) {
          const init: Record<string, any> = {};
          (info.address_info.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
          setCryptoFields(init);
          setCryptoStep(info);
        } else if (info?.gategay_type === "MANUAL") {
          const init: Record<string, any> = {};
          (info.input_fields ?? []).forEach((f: any) => { init[f.name] = ""; });
          setManualFields(init);
          setManualStep(info);
        } else if (/authorize/i.test(info?.identify ?? "")) {
          // Authorize has an in-app card form (not an external redirect).
          setCardStep(info);
        } else if (info?.gategay_type === "AUTOMATIC") {
          // Other automatic gateways → hosted checkout URL.
          // `url` may be a string (Stripe) or an array of links (PayPal → rel:"approve").
          const u = info.url;
          const redirectUrl = Array.isArray(u)
            ? (u.find((l: any) => l?.rel === "approve")?.href ?? u[0]?.href)
            : u;
          if (redirectUrl) window.location.href = redirectUrl;
          else router.push("/dashboard/escrow");
        } else {
          router.push("/dashboard/escrow");
        }
      },
    });
  };

  const onAuthorize = () => {
    const trx = cardStep?.payment_informations?.trx;
    if (!trx) return;
    authorize.mutate({ trx, card_number: card.number, date: card.date, code: card.code });
  };

  const setManualField = (name: string, v: any) => setManualFields((p) => ({ ...p, [name]: v }));
  const onManualPay = () => {
    const trx = manualStep?.payment_informations?.trx;
    if (!trx) return;
    manualPay.mutate({ trx, fields: manualFields });
  };
  const manualValid = (manualStep?.input_fields ?? []).every((f: any) => !f.required || manualFields[f.name]);

  // ── native-crypto step (address + QR + txn-hash) ──
  const setCryptoField = (name: string, v: any) => setCryptoFields((p) => ({ ...p, [name]: v }));
  const cryptoValid = (cryptoStep?.address_info?.input_fields ?? []).every((f: any) => !f.required || cryptoFields[f.name]);
  const onCryptoProceed = () => {
    const submitUrl = cryptoStep?.address_info?.submit_url;
    if (!submitUrl) return;
    cryptoConfirm.mutate({ submitUrl, fields: cryptoFields });
  };
  const copyAddress = () => {
    navigator.clipboard?.writeText(cryptoStep?.address_info?.address ?? "");
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2000);
  };

  const amount = parseFloat(rawAmount) || 0;
  const fee = +(amount * (FEE_PCT / 100)).toFixed(2);
  const total = +(amount + fee).toFixed(2);
  const fmt = (n: number) => (n > 0 ? `${n.toLocaleString()} ${currency}` : "—");

  const SUMMARY_ROWS = [
    { key: "amount", label: t("dashboard.createEscrow.summaryAmount"), Icon: Wallet, value: fmt(amount) },
    { key: "fee",    label: t("dashboard.createEscrow.summaryFee").replace("{pct}", String(FEE_PCT)), Icon: Percent, value: fmt(fee) },
    { key: "total",  label: t("dashboard.createEscrow.summaryTotal"), Icon: BadgeDollarSign, value: fmt(total) },
  ];

  // Dropdown option sets
  const categoryOpts: Opt[] = categories.map((c) => ({ value: String(c.id), label: c.name }));
  // The "other party" option always names the counterparty, not a fixed "Seller" —
  // when I'm the seller, the other party is the buyer, and vice versa.
  const counterpartyRole = role === "seller" ? "buyer" : "seller";
  const whoPaysOpts: Opt[] = [
    { value: "me", label: t("dashboard.createEscrow.whoPaysMe") },
    { value: counterpartyRole, label: t(counterpartyRole === "buyer" ? "dashboard.createEscrow.whoPaysBuyer" : "dashboard.createEscrow.whoPaysSeller") },
    { value: "half", label: t("dashboard.createEscrow.whoPays5050") },
  ];

  // If the role toggle flips (buyer ⇄ seller), the counterparty option's value
  // changes — reset whoPays back to "me" if it's now pointing at a stale option.
  const whoPaysValid = whoPaysOpts.some((o) => o.value === whoPays);
  if (!whoPaysValid) setWhoPays("me");
  const defWallet = wallets.find((w) => w.default === 1) ?? wallets[0];
  const payWithOpts: Opt[] = [
    {
      value: "myWallet",
      label: t("dashboard.createEscrow.myWallet"),
      sub: defWallet ? `${defWallet.currency_symbol}${Number(defWallet.balance).toLocaleString()} ${defWallet.currency_code}` : "",
      icon: <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Wallet size={15} strokeWidth={2} aria-hidden /></span>,
    },
    ...gateways.map((g) => ({ value: String(g.id), label: g.name, sub: g.type })),
  ];

  const canSubmit = title.trim() && category && email.includes("@") && amount > 0 && currency && (role !== "buyer" || payWith);

  const onSubmit = async () => {
    if (!(await kycGate())) return;
    // Hosted (WEB) gateways redirect the browser back to these pages after payment.
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    submit.mutate(
      {
        title,
        escrow_category: category,
        role,
        who_will_pay_options: whoPays,
        buyer_seller_identify: email,
        amount,
        escrow_currency: currency,
        payment_gateway: role === "buyer" ? payWith : "",
        remarks,
        files,
        source: "WEB",
        success_url: `${origin}/dashboard/escrow/success`,
        cancel_url: `${origin}/dashboard/escrow/cancel`,
      },
      { onSuccess: (res) => setPreview((res as any)?.data) },
    );
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
          {/* address + QR + txn hash */}
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.cryptoAddressTitle")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              {/* address + copy */}
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

              {/* QR of the address */}
              {addr.address && (
                <div className="flex justify-center">
                  <div className="w-full max-w-63 rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-4">
                    <QRCodeSVG value={String(addr.address)} size={220} className="h-auto w-full" />
                  </div>
                </div>
              )}

              {/* dynamic fields (txn hash) */}
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

          {/* payment details */}
          <PaymentDetails ci={cryptoStep.payment_informations ?? {}} />
        </div>
      </div>
    );
  }

  // ── Card step (Authorize gateway) — POST authorize-payment-submit ──
  // ── Manual gateway step — dynamic proof form ──
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
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!manualValid}
          loading={manualPay.isPending}
          onClick={onManualPay}
          leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}
        >
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
          {/* card form */}
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.payWithCard")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.cardNumber")} <span className="inline text-red-500">*</span>
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
                    {t("dashboard.createEscrow.expDate")} <span className="inline text-red-500">*</span>
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
                      {dateIssue === "month" ? t("dashboard.createEscrow.expDateMonthError") : t("dashboard.createEscrow.expDateError")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("dashboard.createEscrow.cvc")} <span className="inline text-red-500">*</span>
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
                onClick={onAuthorize}
                leftIcon={<Lock size={16} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.createEscrow.submitPayment")}
              </Button>
            </div>
          </Panel>

          {/* payment details */}
          <PaymentDetails ci={cardStep.payment_informations ?? {}} />
        </div>
      </div>
    );
  }

  // ── Preview step (after submit) — confirm sends only the trx ──
  const einfo = preview?.escrow_information ?? {};
  const isSeller = einfo.my_role === "seller";
  if (preview) {
    const detailRows = [
      { label: t("dashboard.createEscrow.pTitle"), value: einfo.title, Icon: FileText },
      { label: t("dashboard.createEscrow.pRole"), value: einfo.my_role, Icon: User, cap: true },
      { label: t("dashboard.createEscrow.pType"), value: einfo.category, Icon: Package },
      { label: t("dashboard.createEscrow.pTotal"), value: einfo.total_amount, Icon: DollarSign, strong: true },
      { label: t("dashboard.createEscrow.pCharge"), value: einfo.charge_payer, Icon: Tag, cap: true },
    ];
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setPreview(null)}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition hover:text-heading"
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
          {t("dashboard.createEscrow.editDetails")}
        </button>

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
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${strong ? "text-primary" : "text-heading"} ${cap ? "capitalize" : ""}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* payment details */}
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.paymentDetails")} />
            <div className="divide-y divide-border">
              <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                  <CreditCard size={16} strokeWidth={2} aria-hidden />
                </span>
                <span className="flex-1 text-sm text-muted">{t("dashboard.createEscrow.feesCharge")}</span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-amber-500">{einfo.fee}</span>
              </div>
              <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                  <Wallet size={16} strokeWidth={2} aria-hidden />
                </span>
                <span className="flex-1 text-sm text-muted">
                  {isSeller ? t("dashboard.createEscrow.sellerWillGet") : t("dashboard.createEscrow.buyerWillPay")}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-heading">
                  {isSeller ? einfo.seller_amount : einfo.buyer_amount}
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          loading={confirm.isPending}
          onClick={onConfirm}
          leftIcon={<Send size={17} strokeWidth={2.5} aria-hidden />}
        >
          {t("dashboard.createEscrow.confirmSend")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/escrow"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition hover:text-heading"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        {t("dashboard.createEscrow.backToMyEscrow")}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── form card ── */}
        <Panel>
          <PanelHeader title={t("dashboard.createEscrow.title")}>
            <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <ShieldCheck size={13} strokeWidth={2.5} aria-hidden />
              {t("dashboard.createEscrow.securedDeal")}
            </span>
          </PanelHeader>

          <div className="flex flex-col gap-6 p-4 sm:p-6">
            {/* role selector — segmented cards */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("dashboard.createEscrow.yourRole")} <span className="inline text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => {
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`group relative cursor-pointer flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left transition ${
                        active ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "border-border bg-surface hover:border-primary/40"
                      }`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${active ? "bg-primary text-white" : "bg-black/5 text-muted dark:bg-white/10"}`}>
                        <r.Icon size={18} strokeWidth={2} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-sm font-bold ${active ? "text-primary" : "text-heading"}`}>{r.label}</span>
                        <span className="block truncate text-xs text-muted">{r.desc}</span>
                      </span>
                      <span className={`absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full border transition ${active ? "border-primary bg-primary text-white" : "border-border"}`}>
                        {active && <Check size={11} strokeWidth={3} aria-hidden />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* counterparty email + who pays */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.counterpartyEmail")} <span className="inline text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Mail size={16} strokeWidth={2} aria-hidden /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailValid(null); }}
                    onBlur={checkEmail}
                    placeholder={t("dashboard.createEscrow.emailPlaceholder")}
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-10 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {userCheck.isPending ? <Loader2 size={15} className="animate-spin text-muted" aria-hidden />
                      : emailValid === true ? <Check size={15} strokeWidth={2.5} className="text-emerald-500" aria-hidden />
                      : emailValid === false ? <X size={15} strokeWidth={2.5} className="text-rose-500" aria-hidden />
                      : null}
                  </span>
                </div>
                {emailValid === false && <p className="text-xs text-rose-500">{t("dashboard.createEscrow.invalidUser")}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.whoPays")} <span className="inline text-red-500">*</span>
                </label>
                <Select value={whoPays} onChange={setWhoPays} options={whoPaysOpts} />
              </div>
            </div>

            {/* title */}
            <Input
              type="text"
              required
              label={t("dashboard.createEscrow.escrowTitle")}
              leftIcon={<Package size={16} strokeWidth={2} aria-hidden />}
              placeholder={t("dashboard.createEscrow.escrowTitlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* category + amount */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.category")} <span className="inline text-red-500">*</span>
                </label>
                <Select value={category} onChange={setCategory} options={categoryOpts} placeholder="—" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.amount")} <span className="inline text-red-500">*</span>
                </label>
                <div className="flex h-11 rounded-xl border border-border bg-surface transition focus-within:border-primary">
                  <input
                    type="number"
                    min={0}
                    placeholder={t("dashboard.createEscrow.amountPlaceholder")}
                    value={rawAmount}
                    onChange={(e) => setRawAmount(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-heading outline-none placeholder:text-muted"
                  />
                  <CurrencyDropdown value={currency} onChange={setCurrency} wallets={wallets} flagUrl={flagUrl} />
                </div>
              </div>
            </div>

            {/* description */}
            <Input
              type="textarea"
              rows={4}
              label={t("dashboard.createEscrow.termsDescription")}
    
              placeholder={t("dashboard.createEscrow.termsPlaceholder")}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            {/* attachments */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("dashboard.createEscrow.attachments")}
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted outline-none transition file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary focus:border-primary"
              />
            </div>

            {/* pay with — only when the current user is the buyer */}
            {role === "buyer" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("dashboard.createEscrow.payWith")} <span className="inline text-red-500">*</span>
                </label>
                <Select value={payWith} onChange={setPayWith} options={payWithOpts} />
              </div>
            )}

            {/* submit */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canSubmit}
              loading={submit.isPending}
              onClick={onSubmit}
              leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}
            >
              {t("dashboard.createEscrow.createEscrowButton")}
            </Button>
          </div>
        </Panel>

        {/* ── summary card ── */}
        <Panel>
          <PanelHeader title={t("dashboard.createEscrow.summary")} />
          <div className="divide-y divide-border">
            {SUMMARY_ROWS.map(({ key, label, Icon, value }, i) => {
              const isLast = i === SUMMARY_ROWS.length - 1;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-4 px-6 py-4 transition hover:bg-black/2 dark:hover:bg-white/2 ${isLast ? "bg-primary/4" : ""}`}
                >
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${isLast ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-surface text-muted"}`}>
                    <Icon size={16} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${isLast ? "text-primary" : "text-muted"}`}>{label}</p>
                  </div>
                  <p className={`shrink-0 whitespace-nowrap text-sm font-bold tabular-nums ${isLast ? "text-primary" : "text-heading"}`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3.5 sm:px-6 sm:py-4">
            <p className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-primary">
              <Info size={13} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
              {t("dashboard.createEscrow.infoNote")}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
