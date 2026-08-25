/**
 * Deposit routes per wallet: which chains a coin can arrive on, what each costs in
 * waiting, and the address to send to.
 *
 * Separate from `NETWORKS` in `@/config/market`, which is the WITHDRAWAL side —
 * receiving charges nothing, and what a depositor needs is confirmations and minimums.
 *
 * The addresses are derived from the wallet and network keys rather than stored, so a
 * wallet always shows the same one — a placeholder that changed between renders
 * would train people to distrust the copy button.
 */

export type NetworkKey =
  | "bitcoin"
  | "erc20"
  | "bep20"
  | "trc20"
  | "ripple"
  | "dogecoin"
  | "solana";

export type DepositNetwork = {
  label: string;
  /** Typical time to arrive, in minutes. */
  minutes: number;
  /** Blocks the chain has to bury the transaction before we credit it. */
  confirmations: number;
  /** Smallest deposit that gets credited, in USD — converted per coin at its rate. */
  minUsd: number;
  /**
   * Chains that route every user to ONE shared address and tell deposits apart by a
   * tag. Sending without it is the most common way a deposit is lost, so these
   * networks show the tag as loudly as the address.
   */
  memo?: boolean;
};

export const DEPOSIT_NETWORKS: Record<NetworkKey, DepositNetwork> = {
  bitcoin: { label: "Bitcoin", minutes: 25, confirmations: 2, minUsd: 10 },
  erc20: { label: "Ethereum (ERC-20)", minutes: 6, confirmations: 12, minUsd: 20 },
  bep20: { label: "BNB Smart Chain (BEP-20)", minutes: 1, confirmations: 15, minUsd: 5 },
  trc20: { label: "Tron (TRC-20)", minutes: 2, confirmations: 19, minUsd: 5 },
  ripple: { label: "XRP Ledger", minutes: 1, confirmations: 1, minUsd: 5, memo: true },
  dogecoin: { label: "Dogecoin", minutes: 10, confirmations: 6, minUsd: 5 },
  solana: { label: "Solana", minutes: 1, confirmations: 32, minUsd: 5 },
};

/**
 * Which networks each wallet accepts, best route first. Not every coin on every
 * chain — a wrapped version only where one genuinely circulates, since offering a
 * route that does not exist is how deposits get burned.
 */
const WALLET_NETWORKS: Record<string, NetworkKey[]> = {
  btc: ["bitcoin", "bep20"],
  eth: ["erc20", "bep20"],
  usdt: ["trc20", "bep20", "erc20"],
  doge: ["dogecoin", "bep20"],
  sol: ["solana"],
  xrp: ["ripple"],
};

/**
 * The networks a wallet accepts, guaranteed non-empty. A holding with no deposit
 * route is a data error, so a wallet with no entry falls back to the chain nearly
 * everything is bridged onto rather than rendering a page with no address.
 */
export function walletNetworks(walletKey: string): NetworkKey[] {
  const routes = WALLET_NETWORKS[walletKey];
  return routes && routes.length > 0 ? routes : ["bep20"];
}

/* -------------------------------------------------------------------------- */
/* Address generation                                                          */
/* -------------------------------------------------------------------------- */

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BECH32 = "023456789acdefghjklmnpqrstuvwxyz";
const HEX = "0123456789abcdef";

/** How each chain's addresses are shaped, so a placeholder looks like the real thing. */
const ADDRESS_SHAPE: Record<NetworkKey, { prefix: string; length: number; alphabet: string }> = {
  bitcoin: { prefix: "bc1q", length: 38, alphabet: BECH32 },
  erc20: { prefix: "0x", length: 40, alphabet: HEX },
  bep20: { prefix: "0x", length: 40, alphabet: HEX },
  trc20: { prefix: "T", length: 33, alphabet: BASE58 },
  ripple: { prefix: "r", length: 32, alphabet: BASE58 },
  dogecoin: { prefix: "D", length: 33, alphabet: BASE58 },
  solana: { prefix: "", length: 44, alphabet: BASE58 },
};

/** FNV-1a, 32-bit — a stable seed from a string. */
function hash(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A fixed-length string drawn from `alphabet`, decided entirely by `seed`.
 * xorshift32, not `Math.random`: the value has to be identical in the prerendered
 * HTML and every client render, or hydration mismatches.
 */
function scramble(seed: string, length: number, alphabet: string) {
  let state = hash(seed) || 1;
  let out = "";
  for (let i = 0; i < length; i++) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    out += alphabet[state % alphabet.length];
  }
  return out;
}

/** The account's deposit address for one wallet on one network. */
export function depositAddress(walletKey: string, network: NetworkKey) {
  const shape = ADDRESS_SHAPE[network];
  return shape.prefix + scramble(`${walletKey}:${network}`, shape.length, shape.alphabet);
}

/** The destination tag a shared-address chain needs to attribute the deposit. */
export function depositMemo(walletKey: string, network: NetworkKey) {
  // Nine digits, which is what an XRP destination tag looks like.
  return String(100000000 + (hash(`${walletKey}:${network}:memo`) % 899999999));
}

/**
 * What the QR encodes. A payment URI lets a wallet app fill in the network too,
 * which is the mistake this page exists to prevent; chains with no registered
 * scheme fall back to the address alone.
 */
export function depositUri(walletKey: string, network: NetworkKey) {
  const address = depositAddress(walletKey, network);
  if (network === "bitcoin") return `bitcoin:${address}`;
  if (network === "dogecoin") return `dogecoin:${address}`;
  if (network === "erc20") return `ethereum:${address}`;
  if (network === "ripple") return `ripple:${address}?dt=${depositMemo(walletKey, network)}`;
  return address;
}
