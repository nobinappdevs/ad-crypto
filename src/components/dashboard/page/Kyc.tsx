"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CircleCheckBig,
  CircleX,
  Clock,
  FileCheck2,
  IdCard,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import {
  FileField,
  FormLabel,
  FormSection,
  TextAreaField,
  TextField,
} from "@/components/dashboard/FormFields";
import { countryFlag, countryList } from "@/config/countries";
import {
  ACCEPTED_FILE_TYPES,
  KYC_SECTIONS,
  KYC_STATUS,
  MAX_AGE,
  MAX_FILE_BYTES,
  MIN_AGE,
  ageFrom,
  isPast,
  type KycField,
} from "@/config/kyc";

/** What each `kyc_status` value looks like. Keyed by the API's own flag. */
const STATUS_META = {
  0: { key: "unverified", tone: "bg-amber-500/12 text-amber-600 dark:text-amber-400", Icon: ShieldAlert },
  1: { key: "verified", tone: "bg-hero-mint/12 text-hero-mint", Icon: CircleCheckBig },
  2: { key: "pending", tone: "bg-primary/12 text-primary", Icon: Clock },
  3: { key: "rejected", tone: "bg-hero-neg/12 text-hero-neg", Icon: CircleX },
} as const;

type StatusCode = keyof typeof STATUS_META;

/** A field's value: text and dates are strings, uploads are files. */
type FieldValue = string | File | null;

/**
 * Divider between sections. `border-t` is load-bearing: preflight zeroes every
 * border width, so an `<hr>` given only a colour draws nothing at all.
 */
const Rule = () => <hr className="my-6 border-t border-border" />;

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Identity verification: where the account stands, and — while there is anything
 * to do about it — the form that moves it along.
 *
 * The form is BUILT from `@/config/kyc` rather than written out, because upstream
 * these fields are operator-configurable: which documents count, which countries
 * are asked for, whether a selfie is required. A page with the controls hard-coded
 * has to be edited every time that policy changes. The renderer switches on a
 * field's `type`, so adding one to the config is the whole change.
 *
 * It only renders at all when the status is unverified or rejected. Pending means a
 * human is looking at the last submission and a second one just splits the queue;
 * verified means there is nothing left to ask for. Both get the status card alone.
 */
export function Kyc() {
  const { t, lang } = useLang();
  const k = (name: string) => t(`kyc.${name}`);

  const [status, setStatus] = useState<StatusCode>(KYC_STATUS as StatusCode);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  // A field reports its error once the user has left it, or once they have tried to
  // submit — never while they are still typing their first character into it.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const meta = STATUS_META[status];
  const canSubmit = status === 0 || status === 3;

  // Localised and sorted for the active language, so the list reads correctly in
  // Arabic or Hindi rather than being alphabetised in English and translated.
  const countries = useMemo(() => countryList(lang), [lang]);

  const countryOptions: SelectOption[] = useMemo(
    () =>
      countries.map(({ code, name }) => ({
        value: code,
        label: name,
        hint: code,
        icon: (
          <span aria-hidden className="w-6 shrink-0 text-center text-[17px]!">
            {countryFlag(code)}
          </span>
        ),
      })),
    [countries],
  );

  const fields = useMemo(() => KYC_SECTIONS.flatMap((section) => section.fields), []);

  const setValue = (name: string, value: FieldValue) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const touch = (name: string) => setTouched((prev) => new Set(prev).add(name));

  /** Every field's error, computed in one place; display is gated separately. */
  const errors = useMemo(() => {
    const out: Record<string, string | null> = {};

    for (const field of fields) {
      const value = values[field.name];
      out[field.name] = null;

      if (field.type === "file") {
        const file = value instanceof File ? value : null;
        if (!file) {
          if (field.required) out[field.name] = k("errorRequired");
        } else if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          out[field.name] = k("errorFileType");
        } else if (file.size > MAX_FILE_BYTES) {
          out[field.name] = k("errorFileSize");
        }
        continue;
      }

      const text = typeof value === "string" ? value.trim() : "";

      if (!text) {
        if (field.required) out[field.name] = k("errorRequired");
        continue;
      }
      if (field.minLength && text.length < field.minLength) {
        out[field.name] = k("errorTooShort").replace("{min}", String(field.minLength));
        continue;
      }
      // Dates carry the only rules that are not "is it filled in": a date of birth
      // has to belong to an adult, and a document has to still be valid.
      if (field.name === "dob") {
        const age = ageFrom(text);
        if (age === null) out[field.name] = k("errorDateInvalid");
        else if (age < MIN_AGE) out[field.name] = k("errorAge").replace("{age}", String(MIN_AGE));
        else if (age > MAX_AGE) out[field.name] = k("errorDateInvalid");
      }
      if (field.name === "expiry" && isPast(text)) out[field.name] = k("errorExpired");
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, values, lang]);

  /** Null until the field has been visited or the form submitted. */
  const shown = (name: string) => (submitted || touched.has(name) ? errors[name] : null);

  const missing = fields.filter((field) => errors[field.name]);

  /** The rail's checklist — one entry per section, so progress is visible while filling. */
  const progress = KYC_SECTIONS.map((section) => ({
    key: section.key,
    done: section.fields.every((field) => !errors[field.name]),
  }));

  function submit() {
    setSubmitted(true);
    if (missing.length > 0) {
      toast.error(k("errorSummary").replace("{count}", String(missing.length)));
      // Put the first offending control in view — on a form this long the error
      // that blocked the submit is usually off-screen.
      document
        .querySelector("[aria-invalid='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // No endpoint yet, so the transition happens here: submitting hands the
    // documents to a reviewer, which is exactly what status 2 means.
    setStatus(2);
    setValues({});
    setTouched(new Set());
    setSubmitted(false);
    toast.success(k("submittedToast"));
  }

  /** One control, chosen by the field's declared type. */
  function renderField(field: KycField) {
    const label = k(`fields.${field.name}.label`);
    // Declared in the config rather than probed for: `t` echoes an unknown key
    // back, so "does this field have a hint?" cannot be asked of the dictionary.
    const fieldHint = field.hint ? k(`fields.${field.name}.hint`) : undefined;
    const error = shown(field.name);
    const value = typeof values[field.name] === "string" ? (values[field.name] as string) : "";

    if (field.type === "file") {
      return (
        <FileField
          key={field.name}
          required={field.required}
          label={label}
          hint={fieldHint}
          placeholder={k("filePlaceholder")}
          browseLabel={k("fileBrowse")}
          removeLabel={k("fileRemove")}
          file={values[field.name] instanceof File ? (values[field.name] as File) : null}
          onChange={(file) => {
            setValue(field.name, file);
            touch(field.name);
          }}
          error={error}
          className={field.wide ? "sm:col-span-2" : undefined}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <TextAreaField
          key={field.name}
          required={field.required}
          label={label}
          hint={fieldHint}
          placeholder={k(`fields.${field.name}.placeholder`)}
          value={value}
          onChange={(next) => setValue(field.name, next)}
          onBlur={() => touch(field.name)}
          error={error}
          rows={3}
          className={field.wide ? "sm:col-span-2" : undefined}
        />
      );
    }

    if (field.type === "select" || field.type === "country") {
      const isCountry = field.type === "country";
      const options: SelectOption[] = isCountry
        ? countryOptions
        : (field.options ?? []).map((option) => ({
            value: option,
            label: k(`options.${field.name}.${option}`),
          }));

      return (
        <div key={field.name} className={cn("min-w-0", field.wide && "sm:col-span-2")}>
          <FormLabel required={field.required} hint={fieldHint}>
            {label}
          </FormLabel>
          <SelectMenu
            label={label}
            value={value}
            options={options}
            placeholder={isCountry ? k("selectCountry") : k("chooseOne")}
            searchable={isCountry}
            searchPlaceholder={k("searchCountry")}
            emptyText={k("noResults")}
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

    return (
      <TextField
        key={field.name}
        required={field.required}
        type={field.type === "date" ? "date" : "text"}
        label={label}
        hint={fieldHint}
        placeholder={field.type === "date" ? undefined : k(`fields.${field.name}.placeholder`)}
        value={value}
        onChange={(next) => setValue(field.name, next)}
        onBlur={() => touch(field.name)}
        error={error}
        className={field.wide ? "sm:col-span-2" : undefined}
      />
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
              <span className="block text-[13px]! font-bold!">{k(`status.${meta.key}.label`)}</span>
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
              <h2 className="text-[16px]! font-bold!">{k(`status.${meta.key}.title`)}</h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11.5px]! font-semibold!",
                  meta.tone,
                )}
              >
                {k(`status.${meta.key}.label`)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px]! leading-relaxed! text-muted">
              {k(`status.${meta.key}.note`)}
            </p>
          </div>
        </div>
      </Panel>

      {canSubmit && (
        <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          {/* ------------------------- Form ------------------------- */}
          <Panel className="p-4 sm:p-6 lg:col-span-8">
            {KYC_SECTIONS.map((section, index) => (
              <div key={section.key}>
                {index > 0 && <Rule />}
                <FormSection
                  step={index + 1}
                  title={k(`sections.${section.key}.title`)}
                  description={k(`sections.${section.key}.hint`)}
                >
                  {section.fields.map(renderField)}
                </FormSection>
              </div>
            ))}

            <button
              type="button"
              onClick={submit}
              className="btn-lift mt-7 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white"
            >
              <Lock size={15} aria-hidden />
              {k("submitCta")}
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

              <ul className="mt-4 flex flex-col gap-2.5">
                {progress.map((section) => (
                  <li key={section.key} className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-px grid! h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition",
                        section.done
                          ? "border-hero-mint bg-hero-mint text-white"
                          : "border-border text-transparent",
                      )}
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[13px] font-semibold",
                          section.done ? "text-heading" : "text-muted",
                        )}
                      >
                        {k(`sections.${section.key}.title`)}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">
                        {k(`sections.${section.key}.hint`)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <hr className="my-5 border-t border-border" />

              <h3 className="flex items-center gap-2 text-[13.5px]! font-bold!">
                <FileCheck2 size={15} aria-hidden className="text-primary" />
                {k("rulesTitle")}
              </h3>
              <ul className="mt-2.5 flex flex-col gap-2">
                {["legible", "corners", "colour", "size"].map((rule) => (
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
