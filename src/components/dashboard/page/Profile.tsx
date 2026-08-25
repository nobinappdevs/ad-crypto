"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, RotateCcw, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { dialKey, useDialCodeOptions } from "@/hooks/useCountries";
import {
  getProfileFieldErrors,
  useAccountIdentity,
  useProfile,
  useUpdatePassword,
  useUpdateProfile,
} from "@/hooks/useProfile";
import type { UserInfo } from "@/services/profile.service";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { DeleteAccountPanel } from "@/components/dashboard/DeleteAccountPanel";
import { ProfileSkeleton } from "@/components/dashboard/Skeletons";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import {
  FormLabel,
  PasswordField,
  PhoneField,
  TextField,
} from "@/components/dashboard/FormFields";
import { countryFlag, countryList } from "@/config/countries";

const PAGE = "mx-auto w-full max-w-[1280px] p-4 sm:p-6";

const Rule = () => <hr className="my-6 border-t border-border" />;

/** What the avatar upload accepts, and how much of it. */
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const MIN_PASSWORD = 6;

/** The editable text fields, in the order the panel asks for them. */
type Form = {
  firstname: string;
  lastname: string;
  mobile_code: string;
  mobile: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  address: string;
};

const EMPTY: Form = {
  firstname: "",
  lastname: "",
  mobile_code: "",
  mobile: "",
  country: "",
  state: "",
  city: "",
  zip: "",
  address: "",
};

/** The server's record, flattened into the form's own shape. */
const formFrom = (user: UserInfo | undefined): Form => ({
  firstname: user?.firstname ?? "",
  lastname: user?.lastname ?? "",
  // Bare digits, so a stored "+880" matches the picker's own "880" option.
  mobile_code: dialKey(user?.mobile_code),
  mobile: user?.mobile ?? "",
  country: user?.country ?? "",
  state: user?.state ?? "",
  city: user?.city ?? "",
  zip: user?.zip ?? "",
  address: user?.address ?? "",
});

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The account's own record — `GET /user/profile/info`, plus `info/update` and
 * `password/update`.
 *
 * Two panels, because they are two endpoints and two kinds of risk: a password
 * change asks for the current one as proof, a city correction should not. Email and
 * username are absent on purpose — the update endpoint takes neither.
 */
export function Profile() {
  const { t, lang } = useLang();
  const k = (name: string) => t(`profile.${name}`);

  const { data, isPending, isError, error, refetch } = useProfile();
  const identity = useAccountIdentity();
  const user = data?.user_info;

  const save = useUpdateProfile(k("saved"));
  const changePassword = useUpdatePassword(k("password.saved"));

  /* ------------------------------- Details ------------------------------- */

  const [form, setForm] = useState<Form>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  /** Complaints from the last rejected save, keyed by field. */
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  // Seeded once, not on every settle: a background refetch that re-ran this would
  // wipe whatever the user had half-typed. Re-armed after a save, so the panel then
  // shows what the server actually stored.
  const seeded = useRef(false);
  useEffect(() => {
    if (!user || seeded.current) return;
    seeded.current = true;
    setForm(formFrom(user));
  }, [user]);

  const set = (name: keyof Form) => (value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    // The server's complaint was about the old value; it stops applying the moment
    // the field changes.
    setServerErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };
  const touch = (name: string) => setTouched((prev) => new Set(prev).add(name));

  const errors = useMemo(() => {
    const out: Record<string, string | null> = {
      firstname: form.firstname.trim() ? null : k("errorRequired"),
      lastname: form.lastname.trim() ? null : k("errorRequired"),
    };
    for (const [name, message] of Object.entries(serverErrors)) {
      if (message) out[name] = message;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, serverErrors, lang]);

  /** An error is only shown once the user has left the field, or tried to save. */
  const shown = (name: string) =>
    submitted || touched.has(name) ? (errors[name] ?? null) : null;

  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function pickPhoto(file: File | null) {
    if (!file) {
      setPhoto(null);
      setPhotoError(null);
      return;
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      setPhoto(null);
      setPhotoError(k("photo.errorType"));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhoto(null);
      setPhotoError(k("photo.errorSize"));
      return;
    }
    setPhotoError(null);
    setPhoto(file);
  }

  function submitDetails() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || photoError) return;

    save.mutate(
      { ...form, image: photo },
      {
        onSuccess: () => {
          setSubmitted(false);
          setTouched(new Set());
          setServerErrors({});
          // The upload is the server's now; drop the local copy so the card below
          // shows the stored avatar rather than a stale object URL.
          setPhoto(null);
          seeded.current = false;
        },
        onError: (err) => setServerErrors(getProfileFieldErrors(err)),
      },
    );
  }

  /* ------------------------------ Password ------------------------------- */

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordTouched, setPasswordTouched] = useState<Set<string>>(new Set());
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);

  const passwordErrors = useMemo(() => {
    const out: Record<string, string | null> = {
      current_password: current ? null : k("password.errorCurrent"),
      password:
        next.length < MIN_PASSWORD
          ? k("password.errorShort").replace("{min}", String(MIN_PASSWORD))
          : next === current
            ? k("password.errorSame")
            : null,
      password_confirmation: confirm === next ? null : k("password.errorMatch"),
    };
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, next, confirm, lang]);

  const passwordShown = (name: string) =>
    passwordSubmitted || passwordTouched.has(name) ? (passwordErrors[name] ?? null) : null;

  function submitPassword() {
    setPasswordSubmitted(true);
    if (Object.values(passwordErrors).some(Boolean)) return;

    changePassword.mutate(
      { current_password: current, password: next, password_confirmation: confirm },
      {
        // Cleared only on the server's yes — a rejected "current password" leaves
        // the fields as they were so the user corrects one line, not three.
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
          setPasswordTouched(new Set());
          setPasswordSubmitted(false);
        },
      },
    );
  }

  /* ------------------------------- Options ------------------------------- */

  // Localised and sorted for the active language, same as the card application.
  // The VALUE is the country's name, not its code: that is what this endpoint
  // stores and what it sends back.
  const countryOptions: SelectOption[] = useMemo(
    () =>
      countryList(lang).map(({ code, name }) => ({
        value: name,
        label: name,
        hint: code,
        icon: (
          <span aria-hidden className="w-6 shrink-0 text-center text-[17px]!">
            {countryFlag(code)}
          </span>
        ),
      })),
    [lang],
  );

  // Dial codes, from the backend's own country table — see `useDialCodeOptions`.
  const { options: dialCodes } = useDialCodeOptions();

  /* ------------------------------- Render -------------------------------- */

  const header = <DashPageHeader title={k("title")} subtitle={k("subtitle")} />;

  if (isPending) {
    return (
      <div className={PAGE}>
        {header}
        <ProfileSkeleton header={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={PAGE}>
        {header}
        <Panel className="mt-6 p-6 text-center">
          <h2 className="text-[15px]! font-bold!">{k("loadFailed")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {getApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 text-[13px] font-semibold text-heading transition hover:border-primary"
          >
            <RotateCcw size={14} aria-hidden />
            {k("retry")}
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div className={PAGE}>
      {header}

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Profile info ------------------------- */}
        <div className="lg:col-span-7">
          <Panel className="p-4 sm:p-6">
            <AvatarPicker
              name={identity.name}
              email={identity.email}
              initials={identity.initials}
              current={identity.avatar}
              preview={previewUrl}
              picked={photo}
              error={photoError}
              onPick={pickPhoto}
            />

            <Rule />

            <SectionTitle>{k("sections.identity")}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                required
                label={k("firstName")}
                value={form.firstname}
                onChange={set("firstname")}
                onBlur={() => touch("firstname")}
                error={shown("firstname")}
                autoComplete="given-name"
              />
              <TextField
                required
                label={k("lastName")}
                value={form.lastname}
                onChange={set("lastname")}
                onBlur={() => touch("lastname")}
                error={shown("lastname")}
                autoComplete="family-name"
              />
              <PhoneField
                label={k("mobile")}
                code={form.mobile_code}
                codeOptions={dialCodes}
                onCodeChange={set("mobile_code")}
                codeLabel={k("mobileCode")}
                codePlaceholder={k("mobileCodePlaceholder")}
                searchPlaceholder={k("searchCountry")}
                emptyText={k("noCountry")}
                value={form.mobile}
                onChange={set("mobile")}
                onBlur={() => touch("mobile")}
                
                error={shown("mobile")}
                className="sm:col-span-2"
              />
            </div>

            <Rule />

            <SectionTitle>{k("sections.address")}</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <FormLabel>{k("country")}</FormLabel>
                <SelectMenu
                  searchable
                  label={k("country")}
                  placeholder={k("selectCountry")}
                  searchPlaceholder={k("searchCountry")}
                  emptyText={k("noCountry")}
                  value={form.country}
                  options={countryOptions}
                  onChange={(value) => {
                    set("country")(value);
                    touch("country");
                  }}
                />
              </div>
              <TextField
                label={k("state")}
                value={form.state}
                onChange={set("state")}
                onBlur={() => touch("state")}
                error={shown("state")}
                autoComplete="address-level1"
              />
              <TextField
                label={k("city")}
                value={form.city}
                onChange={set("city")}
                onBlur={() => touch("city")}
                error={shown("city")}
                autoComplete="address-level2"
              />
              <TextField
                label={k("zip")}
                value={form.zip}
                onChange={set("zip")}
                onBlur={() => touch("zip")}
                error={shown("zip")}
                autoComplete="postal-code"
              />
              <TextField
                label={k("address")}
                value={form.address}
                onChange={set("address")}
                onBlur={() => touch("address")}
                error={shown("address")}
                autoComplete="street-address"
                className="sm:col-span-2"
              />
            </div>

            <Rule />

            <SubmitButton pending={save.isPending} onClick={submitDetails}>
              {save.isPending ? k("saving") : k("save")}
            </SubmitButton>
          </Panel>
        </div>

        {/* ------------------------- Password + account ------------------------- */}
        {/* The column the profile does not need: one field per row, which is what a
            password panel wants anyway — three secrets read as a sequence. */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <SectionTitle>{k("password.title")}</SectionTitle>

            <div className="flex flex-col gap-4">
              <PasswordField
                label={k("password.current")}
                toggleLabel={k("password.show")}
                value={current}
                onChange={setCurrent}
                onBlur={() => setPasswordTouched((prev) => new Set(prev).add("current_password"))}
                error={passwordShown("current_password")}
                autoComplete="current-password"
              />
              <PasswordField
                label={k("password.new")}
                hint={k("password.rules").replace("{min}", String(MIN_PASSWORD))}
                toggleLabel={k("password.show")}
                value={next}
                onChange={setNext}
                onBlur={() => setPasswordTouched((prev) => new Set(prev).add("password"))}
                error={passwordShown("password")}
                autoComplete="new-password"
              />
              <PasswordField
                label={k("password.confirm")}
                toggleLabel={k("password.show")}
                value={confirm}
                onChange={setConfirm}
                onBlur={() =>
                  setPasswordTouched((prev) => new Set(prev).add("password_confirmation"))
                }
                error={passwordShown("password_confirmation")}
                autoComplete="new-password"
              />

              <SubmitButton pending={changePassword.isPending} onClick={submitPassword}>
                {changePassword.isPending ? k("password.saving") : k("password.cta")}
              </SubmitButton>
            </div>
          </Panel>



          {/* Last in the column, and the only red thing on the page — closing the
              account is not a sibling of "save changes". */}
          <DeleteAccountPanel />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The avatar and the control that replaces it. Round, not the dashed rectangle the
 * KYC uploads use — this image is a circle everywhere else in the app.
 */
function AvatarPicker({
  name,
  email,
  initials,
  current,
  preview,
  picked,
  error,
  onPick,
}: {
  name: string;
  email: string;
  initials: string;
  current: string;
  preview: string | null;
  picked: File | null;
  error: string | null;
  onPick: (file: File | null) => void;
}) {
  const { t } = useLang();
  const k = (key: string) => t(`profile.${key}`);
  const inputRef = useRef<HTMLInputElement>(null);
  // WHICH url failed, not a boolean: a new pick then gets its own attempt, without
  // an effect to reset a flag the src already implies.
  const [brokenSrc, setBrokenSrc] = useState("");

  // The picked file wins over what the server holds — and `current` is already the
  // API's own default portrait when the account has no upload, so initials are the
  // last resort rather than the usual case.
  const src = preview || current;
  const broken = Boolean(src) && src === brokenSrc;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span
        className={cn(
          "grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-black/5 text-[17px] font-bold text-heading dark:bg-white/8",
          error && "ring-2 ring-hero-neg",
        )}
      >
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            onError={() => setBrokenSrc(src)}
            className="h-full w-full object-cover"
          />
        ) : (
          (initials || "—")
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]! font-bold!">{name || "—"}</p>
        <p className="truncate text-[12.5px]! text-muted">{email}</p>
        {error && <p className="mt-1 text-[12px]! text-hero-neg">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          // Re-picking the same file after a removal fires no change event unless
          // the input forgets it.
          e.target.value = "";
        }}
        className="sr-only"
      />
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-9 cursor-pointer rounded-lg border border-border px-3 text-[12.5px] font-semibold text-heading transition hover:border-primary hover:text-primary"
        >
          {k("photo.change")}
        </button>
        {picked && (
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-label={k("photo.remove")}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted transition hover:text-hero-neg"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/** A panel's section heading. No number, no description — the labels below say it. */
function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-[14px]! font-bold!">{children}</h2>;
}

/** The one filled control per panel, full width at every size. */
function SubmitButton({
  pending,
  onClick,
  children,
}: {
  pending: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[14px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
