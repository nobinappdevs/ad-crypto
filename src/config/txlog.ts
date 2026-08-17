import type { DashboardTransaction } from "@/services/dashboard.service";

/**
 * Reading the API's transaction rows.
 *
 * Money and amounts arrive as decimal STRINGS ("0.0466666666666670"), the coin
 * involved sits at a different depth per transaction type, and both `type` and
 * `status` are server values this app has to map onto its own vocabulary. Doing
 * that in one place keeps the table free of the guesswork.
 */

/** A decimal string to a number. Non-numeric input is 0, never NaN on screen. */
export function num(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * A coin amount to at most 8 places with trailing zeros dropped — the API pads
 * everything to 16 ("1.0000000000000000"), which is noise in a table cell.
 */
export function coinAmount(value: string | number | null | undefined): string {
  return num(value).toLocaleString("en-US", { maximumFractionDigits: 8 });
}

/* -------------------------------------------------------------------------- */
/* Type                                                                        */
/* -------------------------------------------------------------------------- */

export type TxTypeKey = "buy" | "sell" | "withdraw" | "exchange";

/**
 * `"Buy Crypto"` -> `"buy"`, or null for a type this build doesn't know.
 *
 * Matched loosely on the leading word rather than on the whole string, so a
 * backend that renames "Withdraw Crypto" to "Withdrawal" keeps working. An
 * unknown type returns null and the caller shows the server's own wording, which
 * is always better than mislabelling it as one of these four.
 */
export function txTypeKey(type: string | undefined): TxTypeKey | null {
  const value = (type ?? "").toLowerCase();
  if (value.includes("buy")) return "buy";
  if (value.includes("sell")) return "sell";
  if (value.includes("withdraw")) return "withdraw";
  if (value.includes("exchange")) return "exchange";
  return null;
}

/** Whether the transaction moves value into the account or out of it. */
export const TX_DIRECTION: Record<TxTypeKey, "in" | "out" | "neutral"> = {
  buy: "in",
  sell: "out",
  withdraw: "out",
  exchange: "neutral",
};

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The API's `status_code` legend, verbatim from `/user/transaction/logs`:
 * `{"1":"Pending","2":"STATUS_CONFIRM_PAYMENT","3":"STATUS_CANCEL","4":"STATUS_REJECT"}`.
 * Those constant names are not user-facing text, hence the mapping to our own.
 */
export type TxStatusKey = "pending" | "confirmed" | "cancelled" | "rejected" | "unknown";

export function txStatusKey(status: number | undefined): TxStatusKey {
  switch (status) {
    case 1:
      return "pending";
    case 2:
      return "confirmed";
    case 3:
      return "cancelled";
    case 4:
      return "rejected";
    default:
      return "unknown";
  }
}

export const TX_STATUS_CLASS: Record<TxStatusKey, string> = {
  pending: "text-amber-600 dark:text-amber-400",
  confirmed: "text-hero-mint",
  cancelled: "text-muted",
  rejected: "text-hero-neg",
  unknown: "text-muted",
};

/* -------------------------------------------------------------------------- */
/* Coin                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Which coin a transaction concerns.
 *
 * Buy and sell put it at `details.data.wallet`; exchange and withdraw split it
 * into `sender_wallet` / `receiver_wallet`. The sender is preferred for those,
 * because it is the balance the row actually debits.
 */
export function txCoin(tx: DashboardTransaction): { name: string; code: string } {
  const data = tx.details?.data;
  const wallet = data?.wallet ?? data?.sender_wallet ?? data?.receiver_wallet;
  return { name: wallet?.name ?? "", code: (wallet?.code ?? "").toUpperCase() };
}

/* -------------------------------------------------------------------------- */
/* Per-type details                                                            */
/* -------------------------------------------------------------------------- */

/**
 * One label/value pair out of a transaction's `details.data`.
 *
 * That payload is per TYPE, not one fixed shape: a sell paid out to a bank carries
 * a branch, an account number and the sender's own reference; an exchange carries
 * two wallets and a rate; a withdraw carries an address. Rather than hard-code one
 * type's fields and drop the rest, everything scalar in the payload becomes a row,
 * and the keys this build recognises get an ordering and a translated label.
 */
export interface TxDetail {
  /** The API's own key — also the i18n lookup, `dashboard.txDetail.<key>`. */
  key: string;
  /** "bank_name" -> "Bank name". Used when there is no translation for the key. */
  label: string;
  value: string;
  /** Set when the value is a link — a screenshot, a receipt, an explorer page. */
  href?: string;
}

/**
 * Plumbing and duplicates of columns the table already has. `status` and
 * `reject_reason` are dropped because the status cell renders both, and the
 * timestamps because the date cell does.
 *
 * `transaction_id` is deliberately NOT here: on a manual payment that field is
 * the reference the USER typed in, not a foreign key.
 */
const DETAIL_SKIP = new Set([
  "id",
  "user_id",
  "user_wallet_id",
  "identifier",
  "payment_gateway_id",
  "status",
  "status_code",
  "reject_reason",
  "created_at",
  "updated_at",
  "deleted_at",
  "image_paths",
  "currency_image_paths",
]);

/**
 * Row-level fields worth showing that are NOT in `details.data` — the charge
 * split behind `total_charge`, the balance the order left behind, and the
 * server's own description of it. A key already present in `details.data` wins.
 */
const ROW_EXTRA = ["remark", "fixed_charge", "percent_charge", "available_balance"] as const;

/** Where a nested wallet keeps its address. On a withdraw this IS the transaction. */
const NESTED_ADDRESS = ["address", "public_address", "wallet_address"];

/**
 * Reading order for the keys this build knows: what the order was for, then who
 * it pays, then the arithmetic, then the evidence. Anything unrecognised keeps
 * its payload order after these (`sort` is stable).
 */
const DETAIL_ORDER = [
  "trx_id",
  "transaction_id",
  "txn_hash",
  "wallet_type",
  "wallet",
  "sender_wallet",
  "sender_wallet_address",
  "receiver_wallet",
  "receiver_wallet_address",
  "coin",
  "network",
  "payment_method",
  "bank_name",
  "bank_number",
  "branch",
  "account_name",
  "account_number",
  "address",
  "wallet_address",
  "amount",
  "enter_amount",
  "sending_amount",
  "receive_amount",
  "get_amount",
  "will_get",
  "exchange_rate",
  "sender_ex_rate",
  "rate",
  "network_fee",
  "network_fees",
  "fixed_charge",
  "percent_charge",
  "total_charge",
  "payable_amount",
  "total_payable",
  "available_balance",
  "note",
  "remark",
  "screenshot",
];

export function txDetails(tx: DashboardTransaction): TxDetail[] {
  const rows: TxDetail[] = [];
  const push = (key: string, value: string, href?: string) => {
    if (value) rows.push({ key, label: humanizeKey(key), value, href });
  };

  for (const [key, raw] of Object.entries(tx.details?.data ?? {})) {
    if (DETAIL_SKIP.has(key)) continue;
    // An empty cell is not information. A field the server sent as null, "" or an
    // object with nothing readable in it is left out rather than shown as "—".
    push(key, detailValue(raw), detailHref(raw));
    // A wallet carries its address next to its name, and the object flattens to
    // the name — so the address gets a row of its own or it is lost.
    push(`${key}_address`, nestedAddress(raw));
  }

  const seen = new Set(rows.map((row) => row.key));
  for (const key of ROW_EXTRA) {
    if (!seen.has(key)) push(key, detailValue(tx[key]));
  }

  const rank = (key: string) => {
    const at = DETAIL_ORDER.indexOf(key);
    return at === -1 ? DETAIL_ORDER.length : at;
  };
  return rows.sort((a, b) => rank(a.key) - rank(b.key));
}

/** The network a row settled on, for its own column. */
export function txNetwork(tx: DashboardTransaction): string {
  const data = tx.details?.data;
  return namedValue(data?.network ?? data?.network_name);
}

/**
 * How the money moved: the payout/payment rail, with the wallet side under it —
 * the pair the detail page puts in its header ("Outside Wallet · ADOut USD").
 */
export function txMethod(tx: DashboardTransaction): { method: string; wallet: string } {
  const data = tx.details?.data;
  return {
    method: namedValue(data?.payment_method ?? data?.method ?? data?.payment_type),
    wallet: namedValue(data?.wallet_type ?? data?.source),
  };
}

/**
 * A value only if it READS as one. These fields are posted as ids
 * (`network=2`, `payment_method=14`) and come back expanded on some payloads and
 * raw on others — "2" under a column headed Network is worse than an empty cell.
 * The bare id still appears in the expanded details, where its key labels it.
 */
function namedValue(raw: unknown): string {
  const value = detailValue(raw);
  return /^-?\d+(\.\d+)?$/.test(value) ? "" : value;
}

/**
 * A detail value as text.
 *
 * Nested objects are only readable when they carry a name — wallets and currencies
 * do, so `{name: "Tether", code: "usdt"}` reads as "Tether (USDT)". Anything else
 * nested returns "" and the caller drops the row.
 */
function detailValue(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "boolean") return raw ? "true" : "false";
  if (typeof raw === "number") return Number.isFinite(raw) ? trimDecimal(String(raw)) : "";

  if (typeof raw === "string") return trimDecimal(raw.trim());

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const node = raw as Record<string, unknown>;
    const name = pickString(node.name ?? node.title ?? node.label);
    const code = pickString(node.code ?? node.symbol);
    if (name && code) return `${name} (${code.toUpperCase()})`;
    return name || (code ? code.toUpperCase() : "");
  }

  return "";
}

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** The address inside a nested wallet, if it carries one. */
function nestedAddress(raw: unknown): string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const node = raw as Record<string, unknown>;
  for (const key of NESTED_ADDRESS) {
    const address = pickString(node[key]);
    if (address) return address;
  }
  return "";
}

/**
 * "10.0000000000000000" -> "10". The API pads every decimal to 16 places, which
 * turns a rate and a fee into a wall of zeros; the significant digits are kept
 * exactly as sent, since this is a string and not a rounded number.
 */
function trimDecimal(value: string): string {
  if (!/^-?\d+\.\d+$/.test(value)) return value;
  return value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

/** Only an absolute URL is linkable — a bare filename has no host to join it to. */
function detailHref(raw: unknown): string | undefined {
  const value = typeof raw === "string" ? raw.trim() : "";
  return /^https?:\/\//i.test(value) ? value : undefined;
}

/** "bank_number" -> "Bank number", for a key with no translation of its own. */
function humanizeKey(key: string): string {
  const words = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return words ? words[0].toUpperCase() + words.slice(1).toLowerCase() : key;
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * `created_at` split into a date and a time, in the active language.
 *
 * Returns empty strings for an unparseable value rather than "Invalid Date" —
 * a blank cell reads as missing data, which is what it is.
 */
export function txDateTime(iso: string | undefined, lang: string) {
  if (!iso) return { date: "", time: "" };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };

  return {
    date: parsed.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" }),
    time: parsed.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }),
  };
}

/** "6m ago" / "3h ago" / "2d ago" — for the notification feed. */
export function relativeTime(iso: string | undefined, lang: string): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";

  const seconds = Math.round((parsed.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(Math.round(seconds), "second");
}
