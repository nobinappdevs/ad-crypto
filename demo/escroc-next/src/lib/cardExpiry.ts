/** Digits-only, capped at 4, auto-slashed as "YY/MM" while typing. */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export type ExpiryIssue = "month" | "past" | null;

/** Validates a "YY/MM" string once all 4 digits are in — null while still typing or if valid. */
export function expiryIssue(value: string): ExpiryIssue {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  if (mm < 1 || mm > 12) return "month";
  const now = new Date();
  const curYY = now.getFullYear() % 100;
  const curMM = now.getMonth() + 1;
  if (yy < curYY || (yy === curYY && mm < curMM)) return "past";
  return null;
}
