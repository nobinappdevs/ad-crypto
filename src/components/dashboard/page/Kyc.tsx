"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CircleCheckBig,
  CircleX,
  Clock,
  FileCheck2,
  IdCard,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { getKycFieldErrors, useKycFields, useSubmitKyc } from "@/hooks/useKyc";
import type { KycField, KycValue } from "@/services/kyc.service";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { KycSkeleton } from "@/components/dashboard/Skeletons";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import {
  FileField,
  FormLabel,
  FormSection,
  TextAreaField,
  TextField,
} from "@/components/dashboard/FormFields";
import {
  KYC_STATUS_KEY,
  acceptAttribute,
  fileTypeAllowed,
  isFieldRequired,
  kycAcceptsSubmission,
  maxFileBytes,
  normalizeKycStatus,
  selectOptions,
} from "@/config/kyc";

/** What each `kyc_status` value looks like. Keyed by the API's own flag. */
const STATUS_META = {
  0: {
    tone: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
    Icon: ShieldAlert,
  },
  1: { tone: "bg-hero-mint/12 text-hero-mint", Icon: CircleCheckBig },
  2: { tone: "bg-primary/12 text-primary", Icon: Clock },
  3: { tone: "bg-hero-neg/12 text-hero-neg", Icon: CircleX },
} as const;

/** `border-t` is load-bearing: preflight zeroes border widths, so a bare `<hr>` draws nothing. */
const Rule = () => <hr className="my-6 border-t border-border" />;

/** Text controls take a full row; files and selects pair up on wide screens. */
function isWide(field: KycField) {
  return field.type === "textarea";
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Identity verification: where the account stands, and the form to move it along.
 *
 * The form is BUILT from `GET /user/profile/kyc/input-fields`, so a field added
 * server-side needs no change here. Its labels are operator free text, which is why
 * they are not translated. Shown only for unverified/rejected.
 */
export function Kyc() {
  const { t } = useLang();
  const k = (name: string) => t(`kyc.${name}`);

  const { data, isPending, isError, error, refetch } = useKycFields();
  const submitKyc = useSubmitKyc(k("submittedToast"));

  const [values, setValues] = useState<Record<string, KycValue>>({});
  // A field reports its error once the user has left it, or once they have tried to
  // submit — never while they are still typing their first character into it.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  /** Field -> message, from the last 422. Cleared as soon as the field changes. */
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const status = normalizeKycStatus(data?.kyc_status);
  const statusKey = KYC_STATUS_KEY[status];
  const meta = STATUS_META[status];
  const fields = useMemo(() => data?.input_fields ?? [], [data]);
  const canSubmit = kycAcceptsSubmission(status) && fields.length > 0;

  function setValue(name: string, value: KycValue) {
    setValues((prev) => ({ ...prev, [name]: value }));
    // The server's complaint was about the old value; keeping it beside the new
    // one would read as a rejection of something the user just fixed.
    setServerErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  const touch = (name: string) => setTouched((prev) => new Set(prev).add(name));

  /** Every field's error in one place; `shown` decides which are displayed. */
  const errors = useMemo(() => {
    const out: Record<string, string | null> = {};

    for (const field of fields) {
      const value = values[field.name];
      const required = isFieldRequired(field);
      out[field.name] = null;

      if (field.type === "file") {
        const file = value instanceof File ? value : null;
        if (!file) {
          if (required) out[field.name] = k("errorRequired");
          continue;
        }
        if (!fileTypeAllowed(file, field.validation?.mimes)) {
          out[field.name] = k("errorFileType").replace(
            "{types}",
            (field.validation?.mimes ?? []).join(", ").toUpperCase(),
          );
          continue;
        }
        const limit = maxFileBytes(field.validation?.max);
        if (limit && file.size > limit) {
          out[field.name] = k("errorFileSize").replace(
            "{max}",
            String(field.validation?.max ?? ""),
          );
        }
        continue;
      }

      const text = typeof value === "string" ? value.trim() : "";
      if (!text) {
        if (required) out[field.name] = k("errorRequired");
        continue;
      }

      // `min`/`max` are lengths for text fields, and the API sends 0 when they
      // don't apply — so a zero is "no rule", not "must be empty".
      const min = Number(field.validation?.min ?? 0);
      if (min > 0 && text.length < min) {
        out[field.name] = k("errorTooShort").replace("{min}", String(min));
        continue;
      }
      const max = Number(field.validation?.max ?? 0);
      if (max > 0 && text.length > max) {
        out[field.name] = k("errorTooLong").replace("{max}", String(max));
      }
    }

    return out;
    // `k` is recreated every render; the dictionary it reads is keyed by language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, values, t]);

  /** Client rule first, then whatever the server said about this field. */
  const shown = (name: string) =>
    (submitted || touched.has(name) ? errors[name] : null) ?? serverErrors[name] ?? null;

  const missing = fields.filter((field) => errors[field.name]);

  function submit() {
    setSubmitted(true);
    if (missing.length > 0) {
      toast.error(k("errorSummary").replace("{count}", String(missing.length)));
      // Put the first offending control in view — the error that blocked the
      // submit is often off-screen on a form with several uploads.
      document
        .querySelector("[aria-invalid='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    submitKyc.mutate(values, {
      onSuccess: () => {
        setValues({});
        setTouched(new Set());
        setSubmitted(false);
        setServerErrors({});
      },
      onError: (err) => setServerErrors(getKycFieldErrors(err)),
    });
  }

  /** One control, chosen by the field's declared type. */
  function renderField(field: KycField) {
    const label = field.label || field.name;
    const required = isFieldRequired(field);
    const error = shown(field.name);
    const wide = isWide(field) ? "sm:col-span-2" : undefined;
    const text = typeof values[field.name] === "string" ? (values[field.name] as string) : "";

    if (field.type === "file") {
      const mimes = field.validation?.mimes;
      const max = field.validation?.max;
      return (
        <FileField
          key={field.name}
          required={required}
          label={label}
          // The limits come from the API, so they are stated rather than assumed.
          hint={
            mimes?.length
              ? k("fileHint")
                  .replace("{types}", mimes.join(", ").toUpperCase())
                  .replace("{max}", String(max ?? "—"))
              : undefined
          }
          accept={acceptAttribute(mimes)}
          placeholder={k("filePlaceholder")}
          browseLabel={k("fileBrowse")}
          removeLabel={k("fileRemove")}
          file={values[field.name] instanceof File ? (values[field.name] as File) : null}
          onChange={(file) => {
            setValue(field.name, file);
            touch(field.name);
          }}
          error={error}
          className={wide}
        />
      );
    }

    if (field.type === "select") {
      const options: SelectOption[] = selectOptions(field.validation?.options);
      return (
        <div key={field.name} className={cn("min-w-0", wide)}>
          <FormLabel required={required}>{label}</FormLabel>
          <SelectMenu
            label={label}
            value={text}
            options={options}
            placeholder={k("chooseOne")}
            showHintInTrigger={false}
            onChange={(next) => {
              setValue(field.name, next);
              touch(field.name);
            }}
          />
          {error && <p className="mt-1.5 text-[12px]! text-hero-neg">{error}</p>}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <TextAreaField
          key={field.name}
          required={required}
          label={label}
          value={text}
          onChange={(next) => setValue(field.name, next)}
          onBlur={() => touch(field.name)}
          error={error}
          rows={3}
          className={wide}
        />
      );
    }

    return (
      <TextField
        key={field.name}
        required={required}
        type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
        label={label}
        value={text}
        onChange={(next) => setValue(field.name, next)}
        onBlur={() => touch(field.name)}
        error={error}
        className={wide}
      />
    );
  }

  /* ------------------------------ Loading / error ------------------------------ */

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        {/* The title is known before the fields are, so it stays real — only the
            form below it is stood in for. */}
        <DashPageHeader title={k("title")} subtitle={k("subtitle")} />
        <KycSkeleton header={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        <DashPageHeader title={k("title")} subtitle={k("subtitle")} />
        <Panel className="mt-6 p-6 text-center">
          <span
            aria-hidden
            className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
          >
            <TriangleAlert size={20} />
          </span>
          <h2 className="mt-4 text-[16px]! font-bold!">{k("loadFailed")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {getApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
          >
            {k("retry")}
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={k("title")}
        subtitle={k("subtitle")}
        action={
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
            <span aria-hidden className={cn("grid! h-7 w-7 place-items-center rounded-lg", meta.tone)}>
              <meta.Icon size={15} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px]! text-muted">{k("statusLabel")}</span>
              <span className="block text-[13px]! font-bold!">{k(`status.${statusKey}.label`)}</span>
            </span>
          </div>
        }
      />

      {/* Status card — the answer to "what happens next", before any field */}
      <Panel className="mt-6 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className={cn("grid! h-12 w-12 shrink-0 place-items-center rounded-2xl", meta.tone)}
          >
            <meta.Icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px]! font-bold!">{k(`status.${statusKey}.title`)}</h2>
              <span
                className={cn("rounded-full px-2.5 py-0.5 text-[11.5px]! font-semibold!", meta.tone)}
              >
                {k(`status.${statusKey}.label`)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px]! leading-relaxed! text-muted">
              {k(`status.${statusKey}.note`)}
            </p>
          </div>
        </div>
      </Panel>

      {canSubmit && (
        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          {/* ------------------------- Form ------------------------- */}
          <Panel className="p-4 sm:p-6 lg:col-span-8">
            <FormSection step={1} title={k("formTitle")} description={k("formHint")}>
              {fields.map(renderField)}
            </FormSection>

            <Rule />

            <button
              type="button"
              onClick={submit}
              disabled={submitKyc.isPending}
              className="btn-lift inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitKyc.isPending ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <Lock size={15} aria-hidden />
              )}
              {submitKyc.isPending ? k("submitting") : k("submitCta")}
            </button>

            <p className="mt-3 flex items-start gap-2 text-[11.5px]! leading-relaxed! text-muted">
              <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-hero-mint" />
              {k("secured")}
            </p>
          </Panel>

          {/* ------------------------- Rail ------------------------- */}
          <div className="lg:sticky lg:top-6 lg:col-span-4">
            <Panel className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid! h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"
                >
                  <IdCard size={17} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[16px]! leading-tight! font-bold!">{k("checklist")}</h2>
                  <p className="mt-1 text-[12.5px]! text-muted">{k("checklistHint")}</p>
                </div>
              </div>

              {/* One row per field, straight off the API — the checklist has to be
                  the same list the form is, or it stops meaning anything. */}
              <ul className="mt-4 flex flex-col gap-2.5">
                {fields.map((field) => {
                  const done = !errors[field.name];
                  return (
                    <li key={field.name} className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cn(
                          "grid! h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition",
                          done
                            ? "border-hero-mint bg-hero-mint text-white"
                            : "border-border text-transparent",
                        )}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                      <span
                        className={cn(
                          "min-w-0 truncate text-[13px] font-semibold",
                          done ? "text-heading" : "text-muted",
                        )}
                      >
                        {field.label || field.name}
                        {!isFieldRequired(field) && (
                          <span className="inline! font-normal! text-muted"> ({k("optional")})</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <hr className="my-5 border-t border-border" />

              <h3 className="flex items-center gap-2 text-[13.5px]! font-bold!">
                <FileCheck2 size={15} aria-hidden className="text-primary" />
                {k("rulesTitle")}
              </h3>
              <ul className="mt-2.5 flex flex-col gap-2">
                {["legible", "corners", "colour"].map((rule) => (
                  <li
                    key={rule}
                    className="flex items-start gap-2 text-[12px]! leading-relaxed! text-muted"
                  >
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {k(`rules.${rule}`)}
                  </li>
                ))}
              </ul>

              <p className="mt-5 rounded-xl bg-primary/8 px-3 py-2.5 text-[12px]! leading-relaxed! text-muted">
                {k("reviewNote")}
              </p>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
