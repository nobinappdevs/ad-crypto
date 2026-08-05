/**
 * Bridge for the homepage "Create New Escrow" quick-form.
 *
 * When a signed-out visitor submits the banner form we can't send them straight
 * to the (auth-guarded) create-escrow page, so we stash their inputs here, send
 * them through login, and — once authenticated — forward them to create-escrow
 * with the data carried in the URL. Signed-in users skip the stash entirely and
 * navigate directly with the same query string.
 */
export const PENDING_ESCROW_KEY = "escroc_pending_escrow";

export interface PendingEscrow {
  role: string;            // "buyer" | "seller"
  title: string;
  amount: string;
  escrow_currency: string;
}

export function savePendingEscrow(data: PendingEscrow) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_ESCROW_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function readPendingEscrow(): PendingEscrow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_ESCROW_KEY);
    return raw ? (JSON.parse(raw) as PendingEscrow) : null;
  } catch {
    return null;
  }
}

export function clearPendingEscrow() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_ESCROW_KEY);
  } catch {
    /* ignore */
  }
}

/** Build the create-escrow URL that pre-fills the form from the given data. */
export function pendingEscrowUrl(data: PendingEscrow): string {
  const qs = new URLSearchParams({
    role: data.role,
    title: data.title,
    amount: data.amount,
    escrow_currency: data.escrow_currency,
  }).toString();
  return `/dashboard/create-escrow?${qs}`;
}
