import { num } from "@/config/txlog";
import type { ExchangeCurrency, ExchangeFees } from "@/services/exchange.service";

/**
 * Pricing a swap the same way the backend does — shared with Withdraw, which is
 * charged by the identical rule.
 *
 * Posting every keystroke to `store` would be a request per character, so the
 * PREVIEW is computed here and the ORDER is still priced by the server: `store`
 * runs once, on review, and its figures are what the confirmation shows.
 *
 * Checked against the endpoint's worked example: 1 ETH (rate 15) for BTC (rate 1)
 * under a 1 fixed / 2 percent charge returns payable 16.02, get 0.0666….
 */

export interface ExchangeFigures {
  /** Receiver coin per 1 sender coin. */
  rate: number;
  sending: number;
  /** The operator's flat charge, converted into the sender's coin. */
  fixedCharge: number;
  percentCharge: number;
  totalCharge: number;
  /** Sending + charges — what actually leaves the sender wallet. */
  payable: number;
  /** What lands in the receiving wallet. Charges do NOT come out of this. */
  receive: number;
}

/** The charge configuration as numbers. `percent` is a percentage, not a fraction. */
export function exchangeFees(fees: ExchangeFees | undefined) {
  return {
    fixed: num(fees?.fixed_charge),
    percent: num(fees?.percent_charge),
    minLimit: num(fees?.min_limit),
    maxLimit: num(fees?.max_limit),
  };
}

/**
 * The order limits in the SENDER's coin. `min_limit`/`max_limit` are configured in
 * the base currency, like the fixed charge, and converted the same way.
 */
export function exchangeLimits(fees: { minLimit: number; maxLimit: number }, senderRate: number) {
  return { min: fees.minLimit * senderRate, max: fees.maxLimit * senderRate };
}

export function exchangeQuote({
  sending,
  senderRate,
  receiverRate,
  fees,
}: {
  sending: number;
  senderRate: number;
  receiverRate: number;
  fees: { fixed: number; percent: number };
}): ExchangeFigures {
  // Both coins are quoted against the same base currency, so the pair is their
  // ratio. A zero rate would make that a division by zero — it means the coin is
  // unpriced, and an unpriced coin converts to nothing.
  const rate = senderRate > 0 ? receiverRate / senderRate : 0;

  const fixedCharge = fees.fixed * senderRate;
  const percentCharge = (sending * fees.percent) / 100;
  const totalCharge = fixedCharge + percentCharge;

  return {
    rate,
    sending,
    fixedCharge,
    percentCharge,
    totalCharge,
    payable: sending + totalCharge,
    receive: sending * rate,
  };
}

/**
 * The largest amount this balance can actually pay for.
 *
 * "Max" cannot be the balance: the charges go ON TOP, so a maxed field would always
 * be rejected. Inverting `payable = sending + fixed + sending·percent/100` gives the
 * number that lands exactly on it — floored to 8 places, since rounding up re-crosses it.
 */
export function maxSendable({
  balance,
  senderRate,
  fees,
}: {
  balance: number;
  senderRate: number;
  fees: { fixed: number; percent: number };
}): number {
  const room = balance - fees.fixed * senderRate;
  if (room <= 0) return 0;
  const sending = room / (1 + fees.percent / 100);
  return Math.max(0, Math.floor(sending * 1e8) / 1e8);
}

/* -------------------------------------------------------------------------- */
/* Reading the index payload                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The user's wallet for a coin, or undefined if they have none.
 *
 * `store` takes a WALLET id, and the two id spaces are different on this API — so a
 * coin without a wallet cannot be a side of the swap and must not fall back to its
 * currency id. Being wrong here debits a wallet the user did not choose.
 */
export function ownWallet(currency: ExchangeCurrency | undefined) {
  return currency?.wallets?.find((wallet) => typeof wallet.id === "number");
}

export function walletBalance(currency: ExchangeCurrency | undefined): number {
  return num(ownWallet(currency)?.balance);
}

/** "1" | "2" | … — currency ids as the string values the pickers work in. */
export function currencyKey(currency: ExchangeCurrency | undefined): string {
  return currency?.id != null ? String(currency.id) : "";
}

/**
 * The coin to open on: the fattest wallet the user holds. Opening on whatever the
 * API listed first means opening on an empty wallet more often than not.
 */
export function defaultSender(currencies: ExchangeCurrency[]): ExchangeCurrency | undefined {
  return currencies
    .filter((currency) => ownWallet(currency))
    .sort((a, b) => walletBalance(b) - walletBalance(a))[0];
}

/**
 * The same choice, plus a coin to convert into — one the user HOLDS as well, since
 * the swap posts a wallet id for that side too. Falling back to the first other
 * coin covers an account that holds only one.
 */
export function defaultPair(currencies: ExchangeCurrency[]): { from: string; to: string } {
  const from = defaultSender(currencies) ?? currencies[0];
  const other = (currency: ExchangeCurrency) => currencyKey(currency) !== currencyKey(from);
  const to =
    currencies.find((currency) => other(currency) && ownWallet(currency)) ??
    currencies.find(other);

  return { from: currencyKey(from), to: currencyKey(to) };
}
