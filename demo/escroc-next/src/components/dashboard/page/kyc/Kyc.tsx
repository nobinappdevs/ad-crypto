"use client";

import { useState } from "react";
import { ShieldCheck, Clock, CircleCheckBig, CircleX, IdCard } from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { useKycFields, useSubmitKyc } from "@/hooks/useKyc";

/* KYC status meta — 0 Unverified, 1 Verified, 2 Pending, 3 Rejected */
const STATUS: Record<number, { label: string; tone: string; Icon: any; note: string }> = {
  0: { label: "dashboard.kyc.statusUnverified", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", Icon: ShieldCheck, note: "dashboard.kyc.noteUnverified" },
  1: { label: "dashboard.kyc.statusVerified",   tone: "bg-emerald-500/10 text-emerald-600", Icon: CircleCheckBig, note: "dashboard.kyc.noteVerified" },
  2: { label: "dashboard.kyc.statusPending",    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", Icon: Clock, note: "dashboard.kyc.notePending" },
  3: { label: "dashboard.kyc.statusRejected",   tone: "bg-rose-500/10 text-rose-500", Icon: CircleX, note: "dashboard.kyc.noteRejected" },
};

/* ── dynamic field ── */
function KycField({ field, value, onChange }: {
  field: any; value: any; onChange: (name: string, value: any) => void;
}) {
  const { t } = useLang();
  const opts: string[] = field.validation?.options ?? [];
  const base = "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-heading outline-none transition placeholder:text-muted focus:border-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {field.label} {field.required && <span className="inline text-red-500">*</span>}
      </label>

      {field.type === "select" ? (
        <Select
          value={value ?? ""}
          onChange={(v) => onChange(field.name, v)}
          options={opts.map((o) => ({ value: o, label: o }))}
          placeholder={`${t("dashboard.kyc.selectPrefix")} ${field.label}`}
          required={field.required}
        />
      ) : field.type === "file" ? (
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
          placeholder={field.label}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

/* ── component ── */
export function Kyc() {
  const { t } = useLang();
  const { data: res, isLoading } = useKycFields();
  const submit = useSubmitKyc();

  const kyc = (res as any)?.data;
  const status: number = kyc?.kyc_status ?? 0;
  const fields: any[] = kyc?.input_fields ?? [];
  const meta = STATUS[status] ?? STATUS[0];

  const [values, setValues] = useState<Record<string, any>>({});
  const setField = (name: string, value: any) => setValues((p) => ({ ...p, [name]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate(values, { onSuccess: () => setValues({}) });
  };

  // Can submit only when unverified (0) or rejected (3).
  const canSubmit = status === 0 || status === 3;

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6">
      {/* status card */}
      <Panel>
        <div className="flex items-center gap-4 p-4 sm:p-6">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${meta.tone}`}>
            <meta.Icon size={22} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-heading">{t("dashboard.kyc.title")}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.tone}`}>{t(meta.label)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{t(meta.note)}</p>
          </div>
        </div>
      </Panel>

      {/* form (only when submittable) */}
      {canSubmit && (
        <Panel>
          <PanelHeader title={t("dashboard.kyc.title")}>
            <IdCard size={16} strokeWidth={2} className="text-muted" aria-hidden />
          </PanelHeader>

          {isLoading ? (
            <div className="space-y-5 p-4 sm:p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-border" />
                  <div className="h-11 w-full animate-pulse rounded-xl bg-border" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-5 p-4 sm:p-6">
              {fields.map((f) => (
                <KycField key={f.name} field={f} value={values[f.name]} onChange={setField} />
              ))}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submit.isPending}
                leftIcon={<ShieldCheck size={17} strokeWidth={2.5} aria-hidden />}
              >
                {t("dashboard.kyc.submit")}
              </Button>
            </form>
          )}
        </Panel>
      )}
    </div>
  );
}
