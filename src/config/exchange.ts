import { num } from "@/config/txlog";
import type { ExchangeCurrency, ExchangeFees } from "@/services/exchange.service";

/**
 * Pricing a swap the same way the backend does — shared with Withdraw, which is
 * charged by the identical rule (its quote even calls the figure `exchange_rate`,
 * 1 when both sides are the same coin).
 *
 * The page could simply post every keystroke to `store` and read the answer, but
 * that is a request per character to price a number the user has not finished
 * typing. So the preview is computed here, and the ORDER is still priced by the
 * server — `store` is called once, on review, and its figures are what the
 * confirmation screen shows.
 *
 * Every rule below is checked against the endpoint's own worked example: sending
 * 1 ETH (rate 15) for BTC (rate 1) under a 1 fixed / 2 percent charge returns
 * `{exchange_rate: 0.0666…, fixed_charge: 15, percent_charge: 0.02,
 * total_charge: 15.02, payable_amount: 16.02, get_amount: 0.0666…}`.
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
 * The order limits in the SENDER's coin.
 *
 * `min_limit` / `max_limit` are configured in the base currency, like the fixed
 * charge, and converted the same way. Confirmed against the previous build's
 * screen: a 0.000001–1000 configuration renders as "0.00001500 – 15000.00000000
 * ETH" at an ETH rate of 15.
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
 * "Max" cannot be the balance itself: the charges are added ON TOP of the amount,
 * so a maxed-out field would always exceed the wallet by the fee and be rejected.
 * Inverting `payable = sending + fixed + sending·percent/100` for `sending` gives
 * the number that lands exactly on the balance — floored to 8 places, since the
 * amount field rounds there and rounding UP would put it back over the edge.
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
 * `store` takes a WALLET id for the side being sent, not a currency id, and the
 * two are different id spaces on this API — so a coin without a wallet cannot be
 * the sender, and must not fall back to its currency id. Being wrong here would
 * mean debiting a wallet the user did not choose.
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
 * The coin to open on: the fattest wallet the user actually holds.
 *
 * Opening on whatever the API happened to list first means opening on an empty
 * wallet more often than not, and the first thing the user would do is change it.
 */
export function defaultSender(currencies: ExchangeCurrency[]): ExchangeCurrency | undefined {
  return currencies
    .filter((currency) => ownWallet(currency))
    .sort((a, b) => walletBalance(b) - walletBalance(a))[0];
}

/**
 * The same choice, plus a coin to convert into.
 *
 * The receiving side has to be a coin the user HOLDS as well, because the swap
 * posts a wallet id for it too — opening on a coin with no wallet would put the
 * form in an error state before the user had touched anything. Falling back to the
 * first other coin covers the account that holds only one.
 */
export function defaultPair(currencies: ExchangeCurrency[]): { from: string; to: string } {
  const from = defaultSender(currencies) ?? currencies[0];
  const other = (currency: ExchangeCurrency) => currencyKey(currency) !== currencyKey(from);
  const to =
    currencies.find((currency) => other(currency) && ownWallet(currency)) ??
    currencies.find(other);

  return { from: currencyKey(from), to: currencyKey(to) };
}
