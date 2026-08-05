/**
 * The KYC form, as data rather than markup.
 *
 * The upstream API hands this back as `input_fields` — a list of names, types and
 * validation rules the operator can change without a release — so the page renders
 * whatever it is given instead of hard-coding controls. Keeping the shape here
 * means swapping this module for the real response is the whole migration.
 *
 * Labels are NOT in here: they are translation keys resolved by the page, so the
 * form reads correctly in all five languages. A field's `name` IS its key.
 */

/** Every control the renderer knows how to draw. */
export type KycFieldType = "text" | "date" | "select" | "country" | "file" | "textarea";

export type KycField = {
  name: string;
  type: KycFieldType;
  required?: boolean;
  /** `select` only — option values; labels come from `kyc.options.<name>.<value>`. */
  options?: readonly string[];
  /** Minimum length a text field has to reach to count as filled in. */
  minLength?: number;
  /** Takes both columns of the two-column grid. */
  wide?: boolean;
  /** Renders `kyc.fields.<name>.hint` beside the label. */
  hint?: boolean;
};

export type KycSection = {
  key: string;
  fields: readonly KycField[];
};

export const KYC_SECTIONS: readonly KycSection[] = [
  {
    key: "identity",
    fields: [
      { name: "firstName", type: "text", required: true, minLength: 2 },
      { name: "lastName", type: "text", required: true, minLength: 2 },
      { name: "dob", type: "date", required: true, hint: true },
      { name: "nationality", type: "country", required: true },
    ],
  },
  {
    key: "document",
    fields: [
      {
        name: "documentType",
        type: "select",
        required: true,
        options: ["passport", "nationalId", "drivingLicence", "residencePermit"],
      },
      { name: "documentNumber", type: "text", required: true, minLength: 4 },
      { name: "issuedBy", type: "country", required: true },
      { name: "expiry", type: "date", required: true, hint: true },
    ],
  },
  {
    key: "scans",
    fields: [
      { name: "docFront", type: "file", required: true },
      { name: "docBack", type: "file", required: true },
      { name: "selfie", type: "file", required: true, wide: true, hint: true },
      { name: "notes", type: "textarea", wide: true, hint: true },
    ],
  },
] as const;

/**
 * 0 unverified, 1 verified, 2 pending review, 3 rejected — the API's own flag.
 *
 * Fixed at 0 while there is no backend: the page renders all four states, and
 * submitting moves it to 2 locally. Change this to preview the rest.
 */
export const KYC_STATUS = 0;

/** The reviewer's limits: 5 MB per scan, and the three formats they can read. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** A document has to outlast the review it is submitted for. */
export const MIN_AGE = 18;
export const MAX_AGE = 100;

/** Whole years between an ISO date and today, or null if the date is unusable. */
export function ageFrom(iso: string) {
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

/** True when an ISO date is in the past — an expiry that has already passed. */
export function isPast(iso: string) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}
