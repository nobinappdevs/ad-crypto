/**
 * Demo market data for the trade pages, shared so Buy and Sell can never quote a
 * different rate for the same coin. Same shape the pricing endpoints return, so
 * wiring it up later is a swap of these constants for a fetch.
 */
export const COINS = [
  {
    key: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    rate: 43009,
    min: 0.0000232509,
    max: 0.0232509475,
    balance: 0.0221150869,
    color: "#f7931a",
    glyph: "₿",
  },
  {
    key: "eth",
    symbol: "ETH",
    name: "Ethereum",
    rate: 2284.5,
    min: 0.000437,
    max: 0.437636,
    balance: 0.3184021,
    color: "#627eea",
    glyph: "Ξ",
  },
  {
    key: "sol",
    symbol: "SOL",
    name: "Solana",
    rate: 98.42,
    min: 0.010161,
    max: 10.160536,
    balance: 7.4208,
    color: "#14f195",
    glyph: "◎",
  },
  {
    key: "xrp",
    symbol: "XRP",
    name: "XRP",
    rate: 0.6214,
    min: 1.609268,
    max: 1609.268,
    balance: 1240.5,
    color: "#23292f",
    glyph: "✕",
  },
] as const;

export type Coin = (typeof COINS)[number];

/** `fee` is charged in `PAY_SYMBOL`, `minutes` is the chain's typical arrival. */
export const NETWORKS = [
  { key: "trc20", label: "Tron (TRC-20)", minutes: 2, fee: 1 },
  { key: "ripple", label: "Ripple", minutes: 3, fee: 2 },
  { key: "bep20", label: "BNB Smart Chain (BEP-20)", minutes: 1, fee: 0.6 },
  { key: "erc20", label: "Ethereum (ERC-20)", minutes: 6, fee: 4.5 },
] as const;

/** Settlement currency. Every fiat-side figure on the trade pages is in this. */
export const PAY_SYMBOL = "USDT";

/** Quick-fill chips under an amount field. 100 renders as "Max". */
export const PERCENTS = [25, 50, 75, 100] as const;

export const toNumber = (raw: string) => {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const fiat = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const usd = (n: number) => `$${fiat(n)}`;

/**
 * A unit price, to four places below a dollar. Two is not enough for a sub-dollar
 * asset: at $0.16 a DOGE row stops reconciling, because 8,500 × 0.16 is not the
 * amount 8,500 × 0.1642 produced.
 */
export const price = (n: number) =>
  n >= 1
    ? usd(n)
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

/**
 * Up to 8 places, trailing zeros dropped. Zero returns "" on purpose: these values
 * are fed back into inputs, where a literal "0" fights the next keystroke.
 */
export const crypto = (n: number) =>
  n === 0 ? "" : Number(n.toFixed(8)).toLocaleString("en-US", { maximumFractionDigits: 8 });

/**
 * `crypto()` ROUNDS to eight places, so a "Max" fill taken from an unfloored balance
 * lands a satoshi above what the wallet holds and trips its own check. Truncating
 * first keeps the ceiling reachable.
 */
export const floor8 = (n: number) => Math.floor(n * 1e8) / 1e8;
