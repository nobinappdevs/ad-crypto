"use client";

import { useMemo, useState } from "react";
import { Check, CreditCard, IdCard, Lock, ShieldCheck } from "lucide-react";
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

/* -------------------------------------------------------------------------- */
/* Rules                                                                       */
/* -------------------------------------------------------------------------- */

const IDENTITY_TYPES = ["passport", "nationalId", "drivingLicence", "residencePermit"] as const;

/** The issuer's own limits: 5 MB per scan, and the three formats it will read. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/** Card issuers require a legal adult; 100 catches a mistyped year. */
const MIN_AGE = 18;
const MAX_AGE = 100;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Docs = "idFront" | "idBack" | "photo";

/** `border-t` is load-bearing: preflight zeroes border widths, so a bare `<hr>` draws nothing. */
const Rule = () => <hr className="my-6 border-t border-border" />;

/** Whole years between `iso` and today, or null if the date is unusable. */
function ageFrom(iso: string) {
  if (!iso) return null;
  const born = new Date(iso);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export function CardCustomer() {
  const { t, lang } = useLang();
  const k = (name: string) => t(`cardCustomer.${name}`);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [identityType, setIdentityType] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [files, setFiles] = useState<Record<Docs, File | null>>({
    idFront: null,
    idBack: null,
    photo: null,
  });
  const [houseNumber, setHouseNumber] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");

  // A field reports its error once the user has left it, or once they have tried
  // to submit — never while they are still typing their first character into it.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const touch = (name: string) => setTouched((prev) => new Set(prev).add(name));

  // Localised and sorted for the active language, so the list reads correctly in
  // Arabic or Hindi rather than being alphabetised in English and translated.
  const countries = useMemo(() => countryList(lang), [lang]);

  function fileProblem(file: File | null) {
    if (!file) return k("errorRequired");
    if (!ACCEPTED.includes(file.type)) return k("errorFileType");
    if (file.size > MAX_FILE_BYTES) return k("errorFileSize");
    return null;
  }

  /** Every field's error, computed in one place; display is gated separately. */
  const errors = useMemo(() => {
    const age = ageFrom(dob);
    return {
      firstName: firstName.trim().length < 2 ? k("errorName") : null,
      lastName: lastName.trim().length < 2 ? k("errorName") : null,
      email: EMAIL.test(email.trim()) ? null : k("errorEmail"),
      dob:
        !dob
          ? k("errorRequired")
          : age === null
            ? k("errorDobInvalid")
            : age < MIN_AGE
              ? k("errorDobAge").replace("{age}", String(MIN_AGE))
              : age > MAX_AGE
                ? k("errorDobInvalid")
                : null,
      identityType: identityType ? null : k("errorRequired"),
      identityNumber: identityNumber.trim().length < 4 ? k("errorIdentityNumber") : null,
      idFront: fileProblem(files.idFront),
      idBack: fileProblem(files.idBack),
      photo: fileProblem(files.photo),
      houseNumber: houseNumber.trim() ? null : k("errorRequired"),
      country: country ? null : k("errorRequired"),
      city: city.trim() ? null : k("errorRequired"),
      state: state.trim() ? null : k("errorRequired"),
      zip: zip.trim() ? null : k("errorRequired"),
      address: address.trim().length < 8 ? k("errorAddress") : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    firstName,
    lastName,
    email,
    dob,
    identityType,
    identityNumber,
    files,
    houseNumber,
    country,
    city,
    state,
    zip,
    address,
    lang,
  ]);

  /** Null until the field has been visited or the form submitted. */
  const shown = (name: keyof typeof errors) =>
    submitted || touched.has(name) ? errors[name] : null;

  const missing = (Object.keys(errors) as (keyof typeof errors)[]).filter((key) => errors[key]);

  /** The rail's checklist — one entry per section, so progress is visible while filling. */
  const groups = [
    { key: "identity", done: !errors.firstName && !errors.lastName && !errors.email && !errors.dob },
    { key: "document", done: !errors.identityType && !errors.identityNumber },
    { key: "scans", done: !errors.idFront && !errors.idBack && !errors.photo },
    {
      key: "address",
      done:
        !errors.country && !errors.city && !errors.state && !errors.zip && !errors.houseNumber && !errors.address,
    },
  ];

  const setFile = (slot: Docs) => (file: File | null) => {
    setFiles((prev) => ({ ...prev, [slot]: file }));
    touch(slot);
  };

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
    toast.success(k("submitted"));
  }

  const identityOptions: SelectOption[] = IDENTITY_TYPES.map((type) => ({
    value: type,
    label: k(`identityTypes.${type}`),
  }));

  const countryOptions: SelectOption[] = countries.map(({ code, name }) => ({
    value: code,
    label: name,
    hint: code,
    icon: (
      <span aria-hidden className="w-6 shrink-0 text-center text-[17px]!">
        {countryFlag(code)}
      </span>
    ),
  }));

  const holder = `${firstName} ${lastName}`.trim();

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      <DashPageHeader
        title={k("title")}
        subtitle={k("subtitle")}
        action={
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
            <span
              aria-hidden
              className="grid! h-7 w-7 place-items-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400"
            >
              <IdCard size={15} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px]! text-muted">{k("statusLabel")}</span>
              <span className="block text-[13px]! font-bold!">{k("statusValue")}</span>
            </span>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Form ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-8">
          <FormSection step={1} title={k("sections.identity")} description={k("sections.identityHint")}>
            <TextField
              required
              label={k("firstName")}
              placeholder={k("firstNamePlaceholder")}
              value={firstName}
              onChange={setFirstName}
              onBlur={() => touch("firstName")}
              error={shown("firstName")}
              autoComplete="given-name"
            />
            <TextField
              required
              label={k("lastName")}
              placeholder={k("lastNamePlaceholder")}
              value={lastName}
              onChange={setLastName}
              onBlur={() => touch("lastName")}
              error={shown("lastName")}
              autoComplete="family-name"
            />
            <TextField
              required
              type="email"
              inputMode="email"
              label={k("email")}
              placeholder={k("emailPlaceholder")}
              value={email}
              onChange={setEmail}
              onBlur={() => touch("email")}
              error={shown("email")}
              autoComplete="email"
            />
            <TextField
              required
              type="date"
              label={k("dob")}
              hint={k("dobHint")}
              value={dob}
              onChange={setDob}
              onBlur={() => touch("dob")}
              error={shown("dob")}
              autoComplete="bday"
            />
          </FormSection>

          <Rule />

          <FormSection step={2} title={k("sections.document")} description={k("sections.documentHint")}>
            <div className="min-w-0">
              <FormLabel required>{k("identityType")}</FormLabel>
              <SelectMenu
                label={k("identityType")}
                placeholder={k("chooseOne")}
                value={identityType}
                options={identityOptions}
                onChange={(v) => {
                  setIdentityType(v);
                  touch("identityType");
                }}
              />
              {shown("identityType") && (
                <p className="mt-1.5 text-[12px]! text-hero-neg">{shown("identityType")}</p>
              )}
            </div>
            <TextField
              required
              label={k("identityNumber")}
              placeholder={k("identityNumberPlaceholder")}
              value={identityNumber}
              onChange={setIdentityNumber}
              onBlur={() => touch("identityNumber")}
              error={shown("identityNumber")}
            />
          </FormSection>

          <Rule />

          <FormSection step={3} title={k("sections.scans")} description={k("sections.scansHint")}>
            <FileField
              required
              label={k("idFront")}
              placeholder={k("filePlaceholder")}
              browseLabel={k("fileBrowse")}
              removeLabel={k("fileRemove")}
              file={files.idFront}
              onChange={setFile("idFront")}
              error={shown("idFront")}
            />
            <FileField
              required
              label={k("idBack")}
              placeholder={k("filePlaceholder")}
              browseLabel={k("fileBrowse")}
              removeLabel={k("fileRemove")}
              file={files.idBack}
              onChange={setFile("idBack")}
              error={shown("idBack")}
            />
            <FileField
              required
              label={k("photo")}
              hint={k("photoHint")}
              placeholder={k("filePlaceholder")}
              browseLabel={k("fileBrowse")}
              removeLabel={k("fileRemove")}
              file={files.photo}
              onChange={setFile("photo")}
              error={shown("photo")}
              className="sm:col-span-2"
            />
          </FormSection>

          <Rule />

          <FormSection step={4} title={k("sections.address")} description={k("sections.addressHint")}>
            <div className="min-w-0">
              <FormLabel required>{k("country")}</FormLabel>
              <SelectMenu
                searchable
                label={k("country")}
                placeholder={k("selectCountry")}
                searchPlaceholder={k("searchCountry")}
                emptyText={k("noCountry")}
                value={country}
                options={countryOptions}
                onChange={(v) => {
                  setCountry(v);
                  touch("country");
                }}
              />
              {shown("country") && (
                <p className="mt-1.5 text-[12px]! text-hero-neg">{shown("country")}</p>
              )}
            </div>
            <TextField
              required
              label={k("city")}
              placeholder={k("cityPlaceholder")}
              value={city}
              onChange={setCity}
              onBlur={() => touch("city")}
              error={shown("city")}
              autoComplete="address-level2"
            />
            <TextField
              required
              label={k("state")}
              placeholder={k("statePlaceholder")}
              value={state}
              onChange={setState}
              onBlur={() => touch("state")}
              error={shown("state")}
              autoComplete="address-level1"
            />
            <TextField
              required
              label={k("zip")}
              placeholder={k("zipPlaceholder")}
              value={zip}
              onChange={setZip}
              onBlur={() => touch("zip")}
              error={shown("zip")}
              autoComplete="postal-code"
              inputMode="text"
            />
            <TextField
              required
              label={k("houseNumber")}
              placeholder={k("houseNumberPlaceholder")}
              value={houseNumber}
              onChange={setHouseNumber}
              onBlur={() => touch("houseNumber")}
              error={shown("houseNumber")}
            />
            <TextAreaField
              required
              label={k("address")}
              placeholder={k("addressPlaceholder")}
              value={address}
              onChange={setAddress}
              onBlur={() => touch("address")}
              error={shown("address")}
              className="sm:col-span-2"
            />
          </FormSection>

          <button
            type="button"
            onClick={submit}
            className="btn-lift mt-7 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white"
          >
            <Lock size={15} aria-hidden />
            {k("continue")}
          </button>

          <p className="mt-3 flex items-start gap-2 text-[11.5px]! leading-relaxed! text-muted">
            <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-hero-mint" />
            {k("secured")}
          </p>
        </Panel>

        {/* ------------------------- Rail ------------------------- */}
        <div className="lg:sticky lg:top-6 lg:col-span-4">
          <Panel className="p-4 sm:p-6">
            {/* The card being applied for, with the holder line tracking the two
                name fields — so a typo in a name is visible where it will end up
                printed rather than only in the field it was typed into. */}
            <div
              className="relative flex h-46 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white"
              style={{
                background:
                  "linear-gradient(135deg, rgb(var(--primary__color)) 0%, #0163a0 55%, #05243d 100%)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-10 -right-8 h-36 w-36 rounded-full bg-white/12 blur-2xl"
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="text-[11px]! font-semibold! tracking-[0.14em] text-white/80 uppercase">
                  {k("cardKind")}
                </span>
                <CreditCard size={20} aria-hidden className="shrink-0 text-white/85" />
              </div>

              <div className="relative">
                <div className="text-[15px]! font-semibold! tracking-[0.18em] text-white/90">
                  •••• •••• •••• ••••
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[9.5px]! tracking-[0.12em] text-white/60 uppercase">
                      {k("cardHolder")}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px]! font-bold! tracking-wide uppercase">
                      {holder || k("cardHolderEmpty")}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="block text-[9.5px]! tracking-[0.12em] text-white/60 uppercase">
                      {k("cardExpiry")}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]! font-bold! tabular-nums">
                      ••/••
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <h2 className="mt-5 text-[16px]! font-bold!">{k("checklist")}</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {groups.map((group) => (
                <li key={group.key} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-px grid! h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition",
                      group.done
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
                        group.done ? "text-heading" : "text-muted",
                      )}
                    >
                      {k(`groups.${group.key}`)}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">
                      {k(`groupsHint.${group.key}`)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-5 rounded-xl bg-primary/8 px-3 py-2.5 text-[12px]! leading-relaxed! text-muted">
              {k("reviewNote")}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
