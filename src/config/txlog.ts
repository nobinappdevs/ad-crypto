import type { DashboardTransaction } from "@/services/dashboard.service";

/**
 * Reading the API's transaction rows: money arrives as decimal STRINGS, the coin
 * sits at a different depth per type, and `type`/`status` are server values that
 * have to be mapped. One place for all of it, so the table stays free of guesswork.
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
 * `"Buy Crypto"` -> `"buy"`, or null for a type this build does not know.
 *
 * Matched on the leading word, so renaming "Withdraw Crypto" keeps working. An
 * unknown type returns null and the caller shows the server's own wording.
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
 * The API's `status_code` legend, verbatim: `{"1":"Pending","2":"STATUS_CONFIRM_PAYMENT",
 * "3":"STATUS_CANCEL","4":"STATUS_REJECT"}`. Those names are not user-facing text.
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
/* The quote                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The priced order, wherever this row keeps it.
 *
 * A buy, a withdraw and an exchange nest it under `details.data`. A SALE does not:
 * its `details` holds the payout form the user filled in, and the order itself —
 * both wallets, the method, the network, `will_get` — sits at the row's own `data`.
 * Reading both here is what keeps every other helper in this file shape-agnostic.
 */
export function txQuote(tx: DashboardTransaction) {
  return tx.details?.data ?? tx.data;
}

/* -------------------------------------------------------------------------- */
/* Coin                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The names the API writes into `remark` mapped back to their tickers, for the rows
 * whose payload does not name the coin any other way. A name that is not here still
 * shows — as the name, without a ticker.
 */
const COIN_CODE_BY_NAME: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  tether: "USDT",
  "usd coin": "USDC",
  dogecoin: "DOGE",
  litecoin: "LTC",
  solana: "SOL",
  ripple: "XRP",
  xrp: "XRP",
  "binance coin": "BNB",
  binance: "BNB",
  tron: "TRX",
};

/**
 * Which coin a transaction concerns. Buy and sell put it at `details.data.wallet`;
 * exchange and withdraw split it in two, and the sender wins — it is the balance
 * the row debits.
 *
 * Past those three, any nested object in the payload that carries a `code` counts:
 * the shape is per type and the backend adds keys without warning, so a `currency`
 * or a `coin` should not read as an empty cell.
 *
 * The last resort is `remark` — "Sell Crypto With Bitcoin", which the API writes on
 * every row. It names the coin in words, and a name beats a dash.
 */
export function txCoin(tx: DashboardTransaction): { name: string; code: string } {
  const data = txQuote(tx);
  const wallet = data?.wallet ?? data?.sender_wallet ?? data?.receiver_wallet ?? codedNode(data);

  const name = pickString(wallet?.name);
  const code = pickString(wallet?.code).toUpperCase();
  if (name || code) return { name, code: code || COIN_CODE_BY_NAME[name.toLowerCase()] || "" };

  const remarked = /\bwith\s+(.+)$/i.exec(pickString(tx.remark))?.[1]?.trim() ?? "";
  return { name: remarked, code: COIN_CODE_BY_NAME[remarked.toLowerCase()] ?? "" };
}

/** The first nested object in a payload that names a coin — `{name, code}`-shaped. */
function codedNode(data: Record<string, unknown> | undefined) {
  for (const value of Object.values(data ?? {})) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const node = value as Record<string, unknown>;
    if (pickString(node.code)) return node as { name?: string; code?: string };
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Per-type details                                                            */
/* -------------------------------------------------------------------------- */

/**
 * One label/value pair out of a transaction's `details.data`.
 *
 * That payload is per TYPE, not one fixed shape, so rather than hard-code one
 * type's fields, everything scalar becomes a row — and the keys this build knows
 * get an ordering and a translated label.
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
 * Plumbing and duplicates of columns the table already has — the status cell renders
 * `status` and `reject_reason`, the date cell the timestamps.
 *
 * `transaction_id` is deliberately NOT here: on a manual payment it is the
 * reference the USER typed, not a foreign key.
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
  // The limit range converted into the coin, which the form used to validate the
  // amount before the order existed. Nothing a reader of a finished order can use.
  "min_max_rate",
  // A sale's quote carries its submitted form a second time, as a JSON STRING. The
  // parsed copy is at `details`, which `txSubmitted` renders field by field.
  "details",
]);

/**
 * Row-level fields worth showing that are NOT in `details.data` — the charge split,
 * the balance left behind, the server's own description. A key already in
 * `details.data` wins.
 */
const ROW_EXTRA = ["remark", "fixed_charge", "percent_charge", "available_balance"] as const;

/** Where a nested wallet keeps its address. On a withdraw this IS the transaction. */
const NESTED_ADDRESS = ["address", "public_address", "wallet_address"];

/**
 * Reading order for known keys: what the order was for, who it pays, the
 * arithmetic, then the evidence. Unrecognised keys keep payload order (`sort` is stable).
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

  for (const [key, raw] of Object.entries(txQuote(tx) ?? {})) {
    if (DETAIL_SKIP.has(key)) continue;
    // An empty cell is not information. A field the server sent as null, "" or an
    // object with nothing readable in it is left out rather than shown as "—".
    push(key, detailValue(raw), detailHref(raw));
    // A wallet carries its address next to its name, and the object flattens to
    // the name — so the address gets a row of its own or it is lost.
    push(key.endsWith("address") ? key : `${key}_address`, nestedAddress(raw));
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

/* -------------------------------------------------------------------------- */
/* What the user submitted                                                     */
/* -------------------------------------------------------------------------- */

/** The three names the API echoes an operator-declared form back under. */
const SUBMITTED_GROUPS = [
  "input_values",
  "gateway_input_values",
  "outside_address_input_values",
] as const;

/**
 * The answers the user gave on an operator's form — a manual payment's transaction
 * id and screenshot, a payout's bank details.
 *
 * The LABEL comes from the payload, not from `t()`: these are fields an operator
 * typed, so there is no key to translate. A file field carries the stored filename,
 * which is shown as-is — the log has no image path to build a URL from, and a
 * filename at least confirms something was attached.
 */
export function txSubmitted(tx: DashboardTransaction): TxDetail[] {
  const rows: TxDetail[] = [];

  for (const group of SUBMITTED_GROUPS) {
    for (const field of tx.details?.[group] ?? []) {
      const value = detailValue(field.value);
      if (!value) continue;
      const key = field.name || field.label || String(rows.length);
      rows.push({
        key: `${group}.${key}`,
        label: pickString(field.label) || humanizeKey(key),
        value,
        href: detailHref(field.value),
      });
    }
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* The gateway's own answer                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The handful of fields worth reading out of `gateway_response`.
 *
 * Stripe's checkout session alone is sixty keys of branding, tax and shipping
 * settings — rendering it wholesale would bury the four lines that matter. So this
 * is a whitelist, and anything a future gateway sends under a different name simply
 * does not appear rather than arriving as noise.
 *
 * `amount_total` is deliberately NOT among them: gateways quote it in the currency's
 * minor unit (57614 = AU$576.14) and which currencies have two decimals is not
 * something this side knows. The row's own payable column already carries the figure.
 */
const GATEWAY_FIELDS: { key: string; from: string; kind?: "seconds" | "mode" }[] = [
  { key: "gateway_reference", from: "id" },
  { key: "payment_status", from: "payment_status" },
  { key: "gateway_status", from: "status" },
  { key: "customer_email", from: "customer_email" },
  { key: "gateway_created", from: "created", kind: "seconds" },
  { key: "expires_at", from: "expires_at", kind: "seconds" },
  { key: "gateway_mode", from: "livemode", kind: "mode" },
];

export function txGateway(tx: DashboardTransaction, lang = "en"): TxDetail[] {
  const response = tx.details?.gateway_response;
  if (!response) return [];

  const rows: TxDetail[] = [];
  for (const field of GATEWAY_FIELDS) {
    const raw = response[field.from];
    const value =
      field.kind === "seconds"
        ? unixDateTime(raw, lang)
        : field.kind === "mode"
          ? modeLabel(raw)
          : detailValue(raw);
    if (value) rows.push({ key: field.key, label: humanizeKey(field.key), value });
  }
  return rows;
}

/**
 * Where an unfinished payment can be resumed, or "".
 *
 * Only for a PENDING row: a gateway's checkout URL outlives the order — Stripe's
 * stays valid for 24 hours — so offering it beside a confirmed purchase invites
 * paying for the same thing twice. The API's own `submit_url` wins when it sends one.
 */
export function txPayUrl(tx: DashboardTransaction): string {
  if (txStatusKey(tx.status) !== "pending") return "";

  const submit = pickString(tx.submit_url);
  if (/^https?:\/\//i.test(submit)) return submit;

  const url = pickString(tx.details?.gateway_response?.url);
  return /^https?:\/\//i.test(url) ? url : "";
}

/** A unix timestamp in seconds, as the reader's own date and time. */
function unixDateTime(raw: unknown, lang: string): string {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return "";
  const { date, time } = txDateTime(new Date(raw * 1000).toISOString(), lang);
  return [date, time].filter(Boolean).join(", ");
}

/** `livemode` as something readable — a bare "false" says nothing. */
function modeLabel(raw: unknown): string {
  if (typeof raw !== "boolean") return "";
  return raw ? "Live" : "Test";
}

/** The network a row settled on, for its own column. */
export function txNetwork(tx: DashboardTransaction): string {
  const data = txQuote(tx);
  return namedValue(data?.network ?? data?.network_name);
}

/**
 * How the money moved: the payout/payment rail, with the wallet side under it —
 * the pair the detail page puts in its header ("Outside Wallet · ADOut USD").
 */
export function txMethod(tx: DashboardTransaction): { method: string; wallet: string } {
  const data = txQuote(tx);
  return {
    method: namedValue(data?.payment_method ?? data?.method ?? data?.payment_type),
    // A sale records the side inside the wallet it sold FROM ("Inside Wallet"),
    // rather than beside the method the way the other types do.
    wallet: namedValue(data?.wallet_type ?? data?.source ?? data?.sender_wallet?.type),
  };
}

/**
 * "xpKWg5…8xPupz" — an address at a length a table cell can hold, with both ends
 * kept: those are the characters a reader checks an address by.
 */
export function shortAddress(value: string, head = 6, tail = 6): string {
  const address = value.trim();
  return address.length <= head + tail + 1
    ? address
    : `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * Where the value went — the receiving coin and the address it landed on, or the
 * rail a purchase used.
 *
 * A withdraw and an exchange carry both sides, and the asset column already shows
 * the sending one, so this is the half that column cannot say.
 */
export function txTarget(tx: DashboardTransaction): { title: string; sub: string } {
  const data = txQuote(tx);

  const receiver = data?.receiver_wallet;
  if (receiver) {
    const code = pickString(receiver.code).toUpperCase();
    const address = nestedAddress(receiver);
    return { title: code || pickString(receiver.name), sub: address ? shortAddress(address) : "" };
  }

  const { method, wallet } = txMethod(tx);
  if (method) return { title: method, sub: wallet };

  // A payout to an address the account does not own arrives flat, not nested.
  const address = pickString(data?.address) || pickString(data?.wallet_address);
  return address ? { title: shortAddress(address), sub: "" } : { title: "", sub: "" };
}

/**
 * "2 + 0.02%" — the two halves `total_charge` is the sum of. Both are on the row
 * itself, so this reads on every transaction, and it answers the question a total
 * charge always raises.
 */
export function txChargeSplit(tx: DashboardTransaction): string {
  const fixed = num(tx.fixed_charge);
  const percent = num(tx.percent_charge);
  if (!fixed && !percent) return "";
  return `${coinAmount(fixed)} + ${coinAmount(percent)}%`;
}

/**
 * What the order returns, in the currency it returns it in — "0.66666667 BTC",
 * "904.36 USD", or "" when the payload does not say.
 *
 * A sale is paid OUT, not into a wallet, so its currency is the payout method's
 * and not a coin at all.
 */
export function txWillGet(tx: DashboardTransaction): string {
  const data = txQuote(tx);
  const raw = data?.will_get ?? data?.get_amount ?? data?.receive_amount;
  if (typeof raw !== "number" && typeof raw !== "string") return "";

  const value = num(raw);
  if (!value) return "";

  const code =
    codeOf(data?.receiver_wallet) || codeOf(data?.payment_method) || codeOf(data?.wallet);
  return [coinAmount(value), code].filter(Boolean).join(" ");
}

/** The ticker on a nested `{code}` node, or "". */
function codeOf(raw: unknown): string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  return pickString((raw as Record<string, unknown>).code).toUpperCase();
}

/**
 * A value only if it READS as one. These are posted as ids and come back expanded on
 * some payloads and raw on others — "2" under a column headed Network is worse than
 * an empty cell. The bare id still shows in the expanded details, where its key labels it.
 */
function namedValue(raw: unknown): string {
  const value = detailValue(raw);
  return /^-?\d+(\.\d+)?$/.test(value) ? "" : value;
}

/**
 * A detail value as text. Nested objects are only readable when they carry a name —
 * `{name: "Tether", code: "usdt"}` reads as "Tether (USDT)". Anything else nested
 * returns "" and the caller drops the row.
 */
function detailValue(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "boolean") return raw ? "true" : "false";
  if (typeof raw === "number") return Number.isFinite(raw) ? trimDecimal(fromFloat(raw)) : "";

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
 * A JSON number to eight places, without the float artifact.
 *
 * `details.data` sends the quote's arithmetic as real numbers rather than the
 * decimal strings the row's own columns use, so the noise binary floats accumulate
 * arrives with it — 43.407000000000004 for a charge, 576.1355100000001 for a
 * payable. Eight places is the depth the amount fields work in, and rounding there
 * removes the artifact without touching a figure anyone entered.
 *
 * The fixed string is kept when `Number` would print an exponent, which it does
 * below 1e-7 — "2e-8" under a column headed Rate is not a number a reader can use.
 */
function fromFloat(value: number): string {
  const fixed = value.toFixed(8);
  const compact = String(Number(fixed));
  return compact.includes("e") ? fixed : compact;
}

/**
 * "10.0000000000000000" -> "10". The API pads every decimal to 16 places. The
 * significant digits are kept exactly as sent — this is a string, not a rounding.
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
 * `created_at` split into a date and a time, in the active language. Empty strings
 * for an unparseable value rather than "Invalid Date".
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

/** Whether a row has anything behind it — the ledger hides its opener when not. */
export function txHasDetails(tx: DashboardTransaction): boolean {
  return txDetails(tx).length > 0 || txSubmitted(tx).length > 0 || txGateway(tx).length > 0;
}
