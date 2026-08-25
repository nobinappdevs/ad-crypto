import { COINS } from "./market";

/**
 * What the account HOLDS — the overview's wallet cards.
 *
 * Not the same list as `COINS`, which is what can be TRADED: the settlement currency
 * is a holding but never a pair, and a coin can sit in a wallet before it is listed.
 * Where a coin is in both, its balance and price are read FROM the trading table.
 */
const traded = (symbol: string) => COINS.find((coin) => coin.symbol === symbol);

export type Wallet = {
  key: string;
  name: string;
  symbol: string;
  balance: number;
  /** Price in USD, for the fiat value under the balance. */
  rate: number;
  /** 24h move on the price — not on the holding. */
  change: string;
  up: boolean;
  color: string;
  glyph: string;
  /** Decimals the balance is shown to: 8 for BTC-like, 2 for a stablecoin. */
  decimals: number;
};

export const WALLETS: Wallet[] = [
  {
    key: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    balance: traded("BTC")?.balance ?? 0,
    rate: traded("BTC")?.rate ?? 0,
    change: "+2.41%",
    up: true,
    color: "#f7931a",
    glyph: "₿",
    decimals: 8,
  },
  {
    key: "eth",
    name: "Ethereum",
    symbol: "ETH",
    balance: traded("ETH")?.balance ?? 0,
    rate: traded("ETH")?.rate ?? 0,
    change: "+1.08%",
    up: true,
    color: "#627eea",
    glyph: "Ξ",
    decimals: 6,
  },
  {
    key: "usdt",
    name: "Tether",
    symbol: "USDT",
    balance: 1284.62,
    // A stablecoin's whole job is to sit at 1.00, so its "24h" is a rounding
    // wobble rather than a move worth an arrow pointing anywhere emphatic.
    rate: 1,
    change: "+0.01%",
    up: true,
    color: "#26a17b",
    glyph: "₮",
    decimals: 2,
  },
  {
    key: "doge",
    name: "Dogecoin",
    symbol: "DOGE",
    balance: 4820.5,
    rate: 0.1642,
    change: "-3.62%",
    up: false,
    color: "#c3a634",
    glyph: "Ð",
    decimals: 2,
  },
  {
    key: "sol",
    name: "Solana",
    symbol: "SOL",
    balance: traded("SOL")?.balance ?? 0,
    rate: traded("SOL")?.rate ?? 0,
    change: "+5.17%",
    up: true,
    color: "#14f195",
    glyph: "◎",
    decimals: 4,
  },
  {
    key: "xrp",
    name: "XRP",
    symbol: "XRP",
    balance: traded("XRP")?.balance ?? 0,
    rate: traded("XRP")?.rate ?? 0,
    change: "-0.84%",
    up: false,
    color: "#23292f",
    glyph: "✕",
    decimals: 2,
  },
];

/** How many cards the overview shows before "View more" opens the rest. */
export const WALLETS_PREVIEW = 4;

/**
 * Resolve a `?coin=` value to a wallet. Takes `string | null` so the details page can
 * hand over the query param untouched — missing and unknown are the same answer.
 */
export function findWallet(key: string | null | undefined) {
  if (!key) return undefined;
  const needle = key.toLowerCase();
  return WALLETS.find((wallet) => wallet.key === needle);
}

/** The details page's URL for a wallet. One place, so no link can go stale. */
export const walletHref = (key: string) => `/dashboard/wallet?coin=${key}`;
