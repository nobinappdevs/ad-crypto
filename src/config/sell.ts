import { num } from "@/config/txlog";
import type { OutsideAddress, SellCurrency } from "@/services/sell.service";

/**
 * Pricing a sale the way the backend does.
 *
 * The direction of the charges is what separates this from a purchase, and it is
 * worth stating plainly: the fees are denominated in the COIN and added ON TOP of
 * the amount, so `payable` (what leaves the wallet) is larger than the amount,
 * while `willGet` is the gross amount converted at the payout rate and is NOT
 * reduced by them.
 *
 * Checked against the endpoint's own worked example — selling 0.002 BTC (rate 1)
 * for ADOut USD (rate 45218, 2 fixed + 1%) returns
 * `{exchange_rate: 45218, fixed_charge: 0.0000442301…, percent_charge: 0.00002,
 *   total_charge: 0.0000642301…, total_payable: 0.00206423…, will_get: 90.436}`.
 */

export interface SellFigures {
  /** Payout currency per 1 coin. */
  rate: number;
  amount: number;
  /** The operator's flat charge, converted INTO the coin. */
  fixedCharge: number;
  percentCharge: number;
  totalCharge: number;
  /** Amount + charges — what leaves the wallet, in the coin. */
  payable: number;
  /** What the user is paid, in the payout currency. */
  willGet: number;
}

export function sellQuote({
  amount,
  coinRate,
  gatewayRate,
  fees,
}: {
  amount: number;
  coinRate: number;
  gatewayRate: number;
  fees: { fixed: number; percent: number };
}): SellFigures {
  // Both the coin and the payout currency are quoted against the same base
  // currency, so the price of one in the other is their ratio.
  const rate = coinRate > 0 ? gatewayRate / coinRate : 0;

  // The flat charge is configured in the payout currency but taken in the coin, so
  // it divides by the pair's rate. A zero rate means the coin is unpriced, and
  // charging an unpriced coin a converted fee would be a division by zero.
  const fixedCharge = rate > 0 ? fees.fixed / rate : 0;
  const percentCharge = (amount * fees.percent) / 100;
  const totalCharge = fixedCharge + percentCharge;

  return {
    rate,
    amount,
    fixedCharge,
    percentCharge,
    totalCharge,
    payable: amount + totalCharge,
    willGet: amount * rate,
  };
}

/**
 * The largest amount this balance can actually cover.
 *
 * "Max" cannot be the balance itself: the charges are added on top, so a maxed-out
 * field would always exceed the wallet by the fee and be rejected. Inverting
 * `payable = amount + fixed/rate + amount·percent/100` for `amount` gives the
 * figure that lands exactly on the balance, floored to 8 places because the field
 * rounds there and rounding UP would put it back over the edge.
 */
export function maxSellable({
  balance,
  rate,
  fees,
}: {
  balance: number;
  rate: number;
  fees: { fixed: number; percent: number };
}): number {
  const room = balance - (rate > 0 ? fees.fixed / rate : 0);
  if (room <= 0) return 0;
  const amount = room / (1 + fees.percent / 100);
  return Math.max(0, Math.floor(amount * 1e8) / 1e8);
}

/* -------------------------------------------------------------------------- */
/* Reading the index payload                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The platform address coins should be sent to for this coin on this network.
 *
 * Keyed by both, because that pair is what a deposit address belongs to — an
 * address for BTC on Ripple is not the one to use for BTC on Cardano. Disabled
 * rows are skipped: `status` is the operator's switch for taking one out of
 * service without deleting it.
 */
export function outsideAddressFor(
  addresses: OutsideAddress[] | undefined,
  currencyId: number | undefined,
  networkId: number | undefined,
): OutsideAddress | undefined {
  if (currencyId == null || networkId == null) return undefined;
  return (addresses ?? []).find(
    (item) =>
      item.currency_id === currencyId &&
      item.network_id === networkId &&
      item.status !== 0 &&
      Boolean(item.slug),
  );
}

/** The first coin worth opening on: one the user actually holds something in. */
export function defaultSellCurrency(currencies: SellCurrency[]): SellCurrency | undefined {
  return (
    currencies.find((currency) => num(currency.wallet?.[0]?.balance) > 0) ??
    currencies.find((currency) => currency.wallet?.[0]) ??
    currencies[0]
  );
}
