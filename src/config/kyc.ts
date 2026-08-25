/**
 * Helpers for the KYC form's server-supplied validation rules.
 *
 * The form itself comes from `GET /user/profile/kyc/input-fields` — operator policy
 * that changes without a release. What lives here is the translation from that
 * payload's conventions (megabytes, bare extensions) into what a browser needs.
 */

import type { KycField, KycStatus } from "@/services/kyc.service";

/** 0 Unverified, 1 Verified, 2 Pending review, 3 Rejected. */
export const KYC_STATUS_KEY: Record<KycStatus, string> = {
  0: "unverified",
  1: "verified",
  2: "pending",
  3: "rejected",
};

/** Only these two leave anything for the user to do; 1 and 2 are waiting states. */
export function kycAcceptsSubmission(status: KycStatus | undefined) {
  return status === 0 || status === 3;
}

/** Anything unrecognised is treated as unverified — the state that asks for documents. */
export function normalizeKycStatus(status: number | undefined): KycStatus {
  return status === 1 || status === 2 || status === 3 ? status : 0;
}

/**
 * `["jpg","png"]` -> `".jpg,.png"` for an `<input accept>`. Extensions, not MIME
 * types: that is the form the API sends, and the mapping is not one-to-one. An
 * empty list returns undefined, so the attribute is omitted rather than set to "".
 */
export function acceptAttribute(mimes: string[] | undefined) {
  if (!mimes?.length) return undefined;
  return mimes.map((ext) => `.${ext.trim().replace(/^\./, "")}`).join(",");
}

/** The API states file limits in MEGABYTES, as a string ("2"). */
export function maxFileBytes(max: string | number | undefined): number | null {
  const mb = typeof max === "string" ? Number(max) : max;
  if (!mb || !Number.isFinite(mb) || mb <= 0) return null;
  return mb * 1024 * 1024;
}

/** A file's extension, lowercased, without the dot. */
export function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Checked by extension, for the same reason `acceptAttribute` uses them. */
export function fileTypeAllowed(file: File, mimes: string[] | undefined) {
  if (!mimes?.length) return true;
  const allowed = mimes.map((ext) => ext.trim().replace(/^\./, "").toLowerCase());
  return allowed.includes(fileExtension(file.name));
}

/**
 * A select option's value and its label. They differ because the API sends options
 * with stray leading whitespace: the label is trimmed to read correctly, the value
 * goes back BYTE-FOR-BYTE, since the backend's `in:` rule compares the original.
 */
export function selectOptions(options: string[] | undefined) {
  return (options ?? []).map((option) => ({ value: option, label: option.trim() }));
}

/** Whether the field is required, per either place the API may say so. */
export function isFieldRequired(field: KycField) {
  return Boolean(field.required || field.validation?.required);
}
