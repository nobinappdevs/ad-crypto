"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Camera, Mail, MapPin, Phone, BadgeCheck, KeyRound, Trash2 } from "lucide-react";
import { Panel, PanelHeader, dsx } from "@/components/dashboard/ui";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useLang } from "@/hooks/useLang";
import { useProfile } from "@/hooks/useAuth";
import { useUpdateProfile, useDeleteAccount, useUpdatePassword } from "@/hooks/useProfile";

const INITIAL_PROFILE = {
  firstName: "", lastName: "", country: "",
  phone: "", phoneCode: "", address: "", city: "", state: "", zip: "",
};

const COUNTRIES = [
  "Bangladesh","United States","United Kingdom","Canada","Australia",
  "Germany","France","India","Singapore","UAE","Saudi Arabia","Japan","Brazil",
];

const pwdStrength = (p) => !p ? 0 :
  [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;

const SMETA = [
  null,
  { labelKey: "weak",   bar: "w-1/4 bg-red-500",    txt: "text-red-500"   },
  { labelKey: "fair",   bar: "w-2/4 bg-amber-500",   txt: "text-amber-500" },
  { labelKey: "good",   bar: "w-3/4 bg-primary",     txt: "text-primary"   },
  { labelKey: "strong", bar: "w-full bg-primary",     txt: "text-primary"   },
];

/* ── reusables ── */
function Label({ text, req }: { text?: React.ReactNode; req?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
      {text}{req && <span className="ml-1 inline text-amber-500">*</span>}
    </label>
  );
}

function PwdInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex h-11 overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary">
      <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-heading outline-none placeholder:text-muted" />
      <button type="button" onClick={() => setShow(v => !v)}
        className="cursor-pointer grid h-full w-11 shrink-0 place-items-center border-l border-border text-muted transition hover:text-heading">
        {show ? <EyeOff size={14} strokeWidth={2} aria-hidden /> : <Eye size={14} strokeWidth={2} aria-hidden />}
      </button>
    </div>
  );
}

/* ── loading skeleton ── */
function SkLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* identity strip */}
      <Panel>
        <div className="flex flex-wrap items-center gap-5 p-4 sm:p-6">
          <div className="h-18 w-18 shrink-0 animate-pulse rounded-full bg-border" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <SkLine className="h-4 w-40" />
            <SkLine className="h-3 w-56" />
            <SkLine className="h-3 w-28" />
          </div>
          <SkLine className="h-9 w-28 rounded-xl" />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* personal info */}
        <Panel>
          <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><SkLine className="h-4 w-40" /></div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <SkLine className="h-3 w-24" />
                  <SkLine className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <SkLine className="mt-6 h-11 w-full rounded-xl" />
          </div>
        </Panel>

        {/* right col */}
        <div className="flex flex-col gap-6">
          <Panel>
            <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5"><SkLine className="h-4 w-40" /></div>
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <SkLine className="h-3 w-28" />
                  <SkLine className="h-11 w-full rounded-xl" />
                </div>
              ))}
              <SkLine className="h-11 w-full rounded-xl" />
            </div>
          </Panel>
          <div className="space-y-3 rounded-2xl border border-red-500/20 p-5">
            <SkLine className="h-3 w-24" />
            <SkLine className="h-3 w-full" />
            <SkLine className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── component ── */
export function Profile() {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profileRes, isLoading } = useProfile();
  const user = (profileRes as any)?.data?.user;
  const apiCountries: string[] | undefined = (profileRes as any)?.data?.countries?.map((c: any) => c.name);
  const countryOptions = apiCountries?.length ? apiCountries : COUNTRIES;

  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(INITIAL_PROFILE);
  const [baseline, setBaseline] = useState(INITIAL_PROFILE);
  const [seededId, setSeededId] = useState<number | null>(null);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // Avatar upload — selected File + a local object-URL for instant preview.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const pickImage = (file?: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickImage(e.dataTransfer.files?.[0]);
  };

  // Seed form + baseline from the API the first time the profile arrives
  // (adjust-state-during-render pattern — no effect, no cascading renders).
  if (user && user.id !== seededId) {
    const next = {
      firstName: user.firstname ?? "",
      lastName: user.lastname ?? "",
      country: user.address?.country ?? "",
      phone: user.mobile ?? "",
      phoneCode: user.mobile_code ?? "",
      address: user.address?.address ?? "",
      city: user.address?.city ?? "",
      state: user.address?.state ?? "",
      zip: user.address?.zip ?? "",
    };
    setSeededId(user.id);
    setForm(next);
    setBaseline(next);
  }

  // Button stays disabled until a field changes or a new image is picked.
  const dirty = !!imageFile || (Object.keys(baseline) as (keyof typeof baseline)[])
    .some((k) => form[k] !== baseline[k]);

  const onSave = () => {
    updateProfile.mutate(
      {
        firstname: form.firstName,
        lastname: form.lastName,
        country: form.country,
        phone_code: form.phoneCode,
        phone: form.phone,
        state: form.state,
        city: form.city,
        zip_code: form.zip,
        address: form.address,
        ...(imageFile ? { image: imageFile } : {}),
      },
      { onSuccess: () => { setBaseline(form); setImageFile(null); } },
    );
  };

  const updatePassword = useUpdatePassword();
  const [pwd, setPwd] = useState({ old: "", next: "", confirm: "" });
  const sp    = (k) => (e) => setPwd(p => ({ ...p, [k]: e.target.value }));
  const s     = pwdStrength(pwd.next);
  const sm    = SMETA[s];
  const match = pwd.next && pwd.confirm && pwd.next === pwd.confirm;

  const onUpdatePassword = () => {
    updatePassword.mutate(
      {
        current_password: pwd.old,
        password: pwd.next,
        password_confirmation: pwd.confirm,
      },
      { onSuccess: () => setPwd({ old: "", next: "", confirm: "" }) },
    );
  };

  // Show the skeleton while the profile is loading for the first time.
  if (isLoading && !user) return <ProfileSkeleton />;

  return (
    <div className="flex flex-col gap-6">

      {/* ── identity strip ── */}
      <Panel>
        <div className="flex flex-wrap items-center gap-4 p-4 sm:gap-5 sm:p-6">
          {/* avatar — click to upload or drag & drop an image */}
          <div
            className="relative shrink-0"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-label={t("dashboard.profile.changePhoto")}
          >
            {imagePreview || user?.userImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview / dynamic remote avatar in a static-export app
              <img src={imagePreview ?? user.userImage} alt={user?.fullname ?? "avatar"}
                className={`h-18 w-18 cursor-pointer rounded-full object-cover ring-4 transition ${dragging ? "ring-primary" : "ring-primary/10"}`} />
            ) : (
              <div className={`grid h-18 w-18 cursor-pointer place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-4 transition ${dragging ? "ring-primary" : "ring-primary/10"}`}>
                {((form.firstName[0] ?? "") + (form.lastName[0] ?? "")).toUpperCase() || "U"}
              </div>
            )}
            {/* hover / drag overlay */}
            <div className={`pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white transition ${dragging ? "opacity-100" : "opacity-0"}`}>
              <Camera size={16} strokeWidth={2} aria-hidden />
            </div>
            <span aria-hidden className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
            <span
              className="pointer-events-none absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted shadow-sm">
              <Camera size={11} strokeWidth={2} aria-hidden />
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
          </div>

          {/* info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-heading">{form.firstName} {form.lastName}</h2>
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <BadgeCheck size={11} strokeWidth={2.5} aria-hidden /> {t("dashboard.profile.verified")}
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold capitalize text-indigo-500 dark:text-indigo-400">{user?.type ?? t("dashboard.profile.buyer")}</span>
            </div>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted">
              <Mail size={12} strokeWidth={2} aria-hidden className="shrink-0" />
              <span className="truncate">{user?.email ?? ""}</span>
            </p>
            <p className="mt-1 text-xs text-muted">{t("dashboard.profile.memberSince")}</p>
          </div>

          {/* delete */}
          <Button variant="danger" size="sm" className="shrink-0" onClick={() => setConfirmDelete(true)}>
            {t("dashboard.profile.deleteAccount")}
          </Button>
        </div>
      </Panel>

      {/* ── forms row ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

        {/* personal info */}
        <Panel>
          <PanelHeader title={t("dashboard.profile.personalInfo")} />
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Input label={t("dashboard.profile.firstName")} required value={form.firstName} onChange={set("firstName")} placeholder={t("dashboard.profile.firstNamePlaceholder")} />
              </div>
              <div>
                <Input label={t("dashboard.profile.lastName")} required value={form.lastName} onChange={set("lastName")} placeholder={t("dashboard.profile.lastNamePlaceholder")} />
              </div>
              <div>
                <Label text={t("dashboard.profile.country")} />
                <Select
                  value={form.country}
                  onChange={(v) => setForm(p => ({ ...p, country: v }))}
                  options={countryOptions.map((c) => ({ value: c, label: c }))}
                  placeholder={t("dashboard.profile.selectCountry")}
                  leftIcon={<MapPin size={14} strokeWidth={2} aria-hidden />}
                />
              </div>
              <div>
                <Input type="tel" label={t("dashboard.profile.phone")} leftIcon={<Phone size={14} strokeWidth={2} aria-hidden />}
                  value={form.phone} onChange={set("phone")} placeholder={t("dashboard.profile.phonePlaceholder")} />
              </div>
              <div className="sm:col-span-2">
                <Input label={t("dashboard.profile.address")} value={form.address} onChange={set("address")} placeholder={t("dashboard.profile.addressPlaceholder")} />
              </div>
              <div>
                <Input label={t("dashboard.profile.city")} value={form.city} onChange={set("city")} placeholder={t("dashboard.profile.cityPlaceholder")} />
              </div>
              <div>
                <Input label={t("dashboard.profile.state")} value={form.state} onChange={set("state")} placeholder={t("dashboard.profile.statePlaceholder")} />
              </div>
              <div>
                <Input label={t("dashboard.profile.zipCode")} value={form.zip} onChange={set("zip")} placeholder={t("dashboard.profile.zipPlaceholder")} />
              </div>
            </div>

            <Button variant="primary" fullWidth className="mt-6" onClick={onSave} disabled={!dirty} loading={updateProfile.isPending}>
              {t("dashboard.profile.saveChanges")}
            </Button>
          </div>
        </Panel>

        {/* right col */}
        <div className="flex flex-col gap-6">
          {/* change password */}
          <Panel>
            <PanelHeader title={t("dashboard.profile.changePassword")}>
              <KeyRound size={15} strokeWidth={2} className="text-muted" aria-hidden />
            </PanelHeader>
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              <div>
                <Label text={t("dashboard.profile.currentPassword")} req />
                <PwdInput value={pwd.old} onChange={sp("old")} placeholder={t("dashboard.profile.currentPasswordPlaceholder")} />
              </div>
              <div>
                <Label text={t("dashboard.profile.newPassword")} req />
                <PwdInput value={pwd.next} onChange={sp("next")} placeholder={t("dashboard.profile.newPasswordPlaceholder")} />
                {pwd.next && (
                  <div className="mt-2.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                      <div className={`h-full rounded-full transition-all duration-300 ${sm?.bar ?? ""}`} />
                    </div>
                    {sm && <p className={`mt-1 text-xs ${sm.txt}`}>{t(`dashboard.profile.${sm.labelKey}`)} {t("dashboard.profile.passwordLabel")}</p>}
                  </div>
                )}
              </div>
              <div>
                <Label text={t("dashboard.profile.confirmPassword")} req />
                <PwdInput value={pwd.confirm} onChange={sp("confirm")} placeholder={t("dashboard.profile.confirmPasswordPlaceholder")} />
                {pwd.confirm && (
                  <p className={`mt-1 text-xs ${match ? "text-primary" : "text-red-500"}`}>
                    {match ? t("dashboard.profile.passwordsMatch") : t("dashboard.profile.passwordsNoMatch")}
                  </p>
                )}
              </div>
              <Button variant="primary" fullWidth disabled={!pwd.old || !pwd.next || !match} loading={updatePassword.isPending} onClick={onUpdatePassword} className="mt-1">
                {t("dashboard.profile.updatePassword")}
              </Button>
            </div>
          </Panel>

          {/* danger */}
          <div className="rounded-2xl border border-red-500/20 p-5">
            <p className="text-sm font-semibold text-red-500">{t("dashboard.profile.dangerZone")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t("dashboard.profile.dangerDesc")}
            </p>
            <Button variant="danger" fullWidth className="mt-4" onClick={() => setConfirmDelete(true)}>
              {t("dashboard.profile.deleteMyAccount")}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete-account confirmation — portalled to <body> to overlay everything. */}
      {confirmDelete && createPortal(
        <div
          className="fixed inset-0 z-60 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { if (!deleteAccount.isPending) setConfirmDelete(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
              <Trash2 size={22} strokeWidth={2} aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-bold text-heading">{t("dashboard.profile.deleteMyAccount")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("dashboard.profile.dangerDesc")}</p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteAccount.isPending}
                className="flex-1 cursor-pointer rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-heading transition hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
              >
                {t("dashboard.navbar.cancel")}
              </button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                loading={deleteAccount.isPending}
                onClick={() => deleteAccount.mutate()}
                className="flex-1"
              >
                {t("dashboard.profile.deleteMyAccount")}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
