"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, Copy, Check, ShieldCheck, FileText, User, DollarSign, CreditCard, Coins,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/hooks/useLang";
import { useEscrowCryptoAddress, useEscrowCryptoConfirm } from "@/hooks/useEscrow";

/* escrow status enum → i18n key + dot colour */
const STATUS_META: Record<number, { key: string; dot: string; text: string }> = {
  1: { key: "ongoing", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  2: { key: "paymentPending", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  3: { key: "approvalPending", dot: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-400" },
  4: { key: "released", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  5: { key: "activeDispute", dot: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" },
  6: { key: "disputed", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
  7: { key: "canceled", dot: "bg-slate-500", text: "text-slate-600 dark:text-slate-400" },
  8: { key: "refunded", dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
  9: { key: "paymentWaiting", dot: "bg-fuchsia-500", text: "text-fuchsia-600 dark:text-fuchsia-400" },
};

/* dynamic input field (txn hash) */
function CryptoField({ field, value, onChange }: { field: any; value: any; onChange: (name: string, v: any) => void }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {field.label} {field.required ? <span className="inline text-red-500">*</span> : <span className="text-muted">{t("dashboard.common.optional")}</span>}
      </label>
      <input
        type={field.type === "number" ? "number" : "text"}
        value={value ?? ""}
        required={field.required}
        placeholder={field.placeholder ?? field.label}
        onChange={(e) => onChange(field.name, e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary"
      />
    </div>
  );
}

function DetailRow({ label, value, Icon, strong }: { label: string; value: any; Icon: any; strong?: boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className={`flex items-center gap-4 px-6 py-4 ${strong ? "bg-primary/4" : ""}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <Icon size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className={`flex-1 text-sm ${strong ? "font-bold text-heading" : "text-muted"}`}>{label}</span>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${strong ? "text-primary" : "text-heading"}`}>{value}</span>
    </div>
  );
}

/* loading skeleton */
function CryptoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <Panel>
        <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><div className="h-4 w-44 animate-pulse rounded bg-border" /></div>
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <div className="h-11 w-full animate-pulse rounded-xl bg-border" />
          <div className="mx-auto h-56 w-56 animate-pulse rounded-2xl bg-border" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-border" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-border" />
        </div>
      </Panel>
      <Panel>
        <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><div className="h-4 w-32 animate-pulse rounded bg-border" /></div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="h-9 w-9 animate-pulse rounded-full bg-border" /><div className="h-3 flex-1 animate-pulse rounded bg-border" /><div className="h-3 w-16 animate-pulse rounded bg-border" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function EscrowCryptoAddress() {
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const mode = params.get("mode") === "action" ? "action" : "my";

  const { data: res, isLoading } = useEscrowCryptoAddress(id, mode);
  const d = (res as any)?.data;
  const esc = d?.escrow_data ?? {};
  const addr = d?.address_info ?? {};
  const cryptoConfirm = useEscrowCryptoConfirm();

  const [fields, setFields] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState(false);

  const setField = (name: string, v: any) => setFields((p) => ({ ...p, [name]: v }));
  const valid = (addr.input_fields ?? []).every((f: any) => !f.required || fields[f.name]);
  const proceed = () => {
    if (addr.submit_url) cryptoConfirm.mutate({ submitUrl: addr.submit_url, fields });
  };
  const copyAddress = () => {
    navigator.clipboard?.writeText(addr.address ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusMeta = STATUS_META[Number(esc.status)];

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
        <CryptoSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* address + QR + txn hash */}
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.cryptoAddressTitle")} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
                <input readOnly value={addr.address ?? ""} className="min-w-0 flex-1 cursor-default bg-transparent px-4 font-mono text-sm text-heading outline-none" />
                <button
                  type="button"
                  onClick={copyAddress}
                  aria-label={copied ? t("dashboard.createEscrow.copied") : t("dashboard.createEscrow.copyAddress")}
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-l border-border px-4 text-sm font-semibold transition ${copied ? "bg-primary/10 text-primary" : "bg-surface text-muted hover:bg-primary/10 hover:text-primary"}`}
                >
                  {copied ? <Check size={15} strokeWidth={2.5} aria-hidden /> : <Copy size={15} strokeWidth={2} aria-hidden />}
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
                <CryptoField key={f.name} field={f} value={fields[f.name]} onChange={setField} />
              ))}

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!valid}
                loading={cryptoConfirm.isPending}
                onClick={proceed}
                leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.createEscrow.cryptoProceed")}
              </Button>
            </div>
          </Panel>

          {/* escrow details */}
          <Panel>
            <PanelHeader title={t("dashboard.createEscrow.escrowDetails")} />
            <div className="divide-y divide-border">
              <DetailRow label={t("dashboard.conversation.title")} value={esc.title} Icon={FileText} />
              <DetailRow label={t("dashboard.conversation.myRole")} value={esc.role ? String(esc.role).replace(/^\w/, (c: string) => c.toUpperCase()) : null} Icon={User} />
              <DetailRow label={t("dashboard.createEscrow.payWith")} value={esc.payment_gateway_currency?.name ?? addr.coin} Icon={Coins} />
              <DetailRow
                label={t("dashboard.conversation.totalPrice")}
                value={esc.amount != null ? `${esc.amount} ${esc.escrow_currency ?? ""}`.trim() : null}
                Icon={DollarSign}
                strong
              />
              {statusMeta && (
                <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    <CreditCard size={16} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="flex-1 text-sm text-muted">{t("dashboard.conversation.status")}</span>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold ${statusMeta.text}`}>
                    <i className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                    {t(`dashboard.escrowStatus.${statusMeta.key}`)}
                  </span>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
