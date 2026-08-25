import type { UserNotification } from "@/services/notification.service";

/**
 * Reading the notification feed. The API sends a `message` object rather than a
 * sentence, and no read/unread flag at all — so this module composes the line from
 * the parts, and derives "new" from something we can legitimately know.
 */

export type NotificationKind = "buy" | "sell" | "withdraw" | "exchange" | "receive" | "card" | "other";

/**
 * Which icon a row gets, guessed from the server's own title. Guessing is fine here:
 * an unrecognised title falls to "other" and gets a neutral bell.
 */
export function notificationKind(title: string | undefined): NotificationKind {
  const value = (title ?? "").toLowerCase();
  if (value.includes("receiv")) return "receive";
  if (value.includes("buy")) return "buy";
  if (value.includes("sell")) return "sell";
  if (value.includes("withdraw")) return "withdraw";
  if (value.includes("exchange")) return "exchange";
  if (value.includes("card")) return "card";
  return "other";
}

/**
 * The second line of a row: the amount and coin, then the server's outcome text.
 * Missing parts are left out, so a sparse notification renders a short line.
 */
export function notificationBody(notification: UserNotification): string {
  const message = notification.message;
  if (!message) return "";

  const amount =
    message.amount === undefined || message.amount === null
      ? ""
      : Number(message.amount).toLocaleString("en-US", { maximumFractionDigits: 8 });

  const holding = [amount, message.code || message.wallet].filter(Boolean).join(" ");
  return [holding, message.success].filter(Boolean).join(" · ");
}

/* -------------------------------------------------------------------------- */
/* "New since you last looked"                                                 */
/* -------------------------------------------------------------------------- */

const SEEN_KEY = "adcrypto_notifications_seen_at";

/**
 * The API has no read state, so a server-backed unread count is not available. What
 * IS knowable is when this browser last opened the panel — which is what the badge
 * actually claims. A fresh browser simply starts with everything looking new.
 */
export function readNotificationsSeenAt(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markNotificationsSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {}
}

/**
 * The stored timestamp for `useSyncExternalStore`, cached for the life of the page.
 *
 * Cached DELIBERATELY, and never invalidated: opening the panel writes a new
 * timestamp, and a snapshot that followed the store would clear the "new" highlight
 * under the reader's eyes while they are looking at it. A reload reads again.
 *
 * The subscribe/snapshot pair rather than an effect because the value cannot be
 * read on the server: this way hydration renders the server's answer and the client
 * swaps in its own, with no cascading `setState` and no markup mismatch.
 */
let seenAtCache: number | null = null;

export function getNotificationsSeenAt(): number {
  if (seenAtCache === null) seenAtCache = readNotificationsSeenAt();
  return seenAtCache;
}

/** No `localStorage` on the server, so nothing has been seen yet. */
export function getNotificationsSeenAtServer(): number {
  return 0;
}

/** Nothing to subscribe to — the snapshot is fixed once it has been taken. */
export function subscribeNotificationsSeen(): () => void {
  return () => {};
}

/** Created after the last time the panel was opened. */
export function isUnseen(notification: UserNotification, seenAt: number): boolean {
  if (!seenAt) return true;
  const created = new Date(notification.created_at ?? "").getTime();
  return Number.isNaN(created) ? false : created > seenAt;
}
