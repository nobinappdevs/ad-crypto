import type { UserNotification } from "@/services/notification.service";

/**
 * Reading the notification feed.
 *
 * The API sends a `message` object rather than a sentence, and no read/unread
 * flag of any kind — see `UserNotification`. Both facts shape what this module
 * does: compose the line from the parts, and derive "new" from something we can
 * legitimately know ourselves.
 */

export type NotificationKind = "buy" | "sell" | "withdraw" | "exchange" | "receive" | "card" | "other";

/**
 * Which icon a row gets, guessed from the server's own title.
 *
 * Guessing is fine here because the consequence is only an icon: an unrecognised
 * title falls to "other" and gets a neutral bell rather than a wrong symbol.
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
 * The second line of a row: the amount and coin it concerns, then the server's
 * own outcome text. Parts that are missing are simply left out, so a sparse
 * notification renders a short line instead of "undefined undefined".
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
 * The API has no read state and no endpoint to set one, so a server-backed
 * unread count is not available. What IS knowable is when this browser last
 * opened the panel — anything created after that is new to this user, which is
 * what the badge is actually claiming. Stored locally and clearly ours; a fresh
 * browser simply starts with everything looking new.
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

/** Created after the last time the panel was opened. */
export function isUnseen(notification: UserNotification, seenAt: number): boolean {
  if (!seenAt) return true;
  const created = new Date(notification.created_at ?? "").getTime();
  return Number.isNaN(created) ? false : created > seenAt;
}
