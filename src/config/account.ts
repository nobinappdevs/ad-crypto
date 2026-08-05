/**
 * The signed-in identity and the notification feed, as demo data.
 *
 * Both are placeholders for endpoints that do not exist yet, so they are shaped
 * like a response rather than like markup: one flat list, translation KEYS instead
 * of sentences, and an age in minutes instead of a pre-rendered "2h ago" — the
 * panel formats that against the active language.
 *
 * The identity matches a row in `@/config/transactions`, so the avatar in the
 * header is the same person the ledger says executed the orders.
 */
export const DEMO_USER = {
  name: "Olivia Carter",
  email: "olivia@compani.com",
  avatar: "/assets/download/aveter.webp",
  initials: "OC",
};

/** Decides the row's icon, its tint and where it navigates. */
export type NotificationKind = "buy" | "sell" | "withdraw" | "exchange" | "card";

export type Notification = {
  id: string;
  kind: NotificationKind;
  /** Key under `dashboard.notificationsPanel.items`. */
  key: string;
  minutesAgo: number;
  seen: boolean;
};

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "buy", key: "buyFilled", minutesAgo: 6, seen: false },
  { id: "n2", kind: "sell", key: "sellReview", minutesAgo: 48, seen: false },
  { id: "n3", kind: "withdraw", key: "withdrawSent", minutesAgo: 180, seen: true },
  { id: "n4", kind: "exchange", key: "exchangeDone", minutesAgo: 1500, seen: true },
  { id: "n5", kind: "card", key: "cardReview", minutesAgo: 4300, seen: true },
];
