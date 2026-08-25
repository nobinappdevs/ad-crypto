import { num } from "@/config/txlog";
import type { BuyCurrency, BuyGateway, BuyNetwork } from "@/services/buy.service";

/**
 * Pricing a purchase the same way the backend does, plus the rules for reading its
 * index payload.
 *
 * The PREVIEW is computed here and the ORDER is still priced by the server: `store`
 * runs once, on review, and its figures are what is charged.
 *
 * Checked against the endpoint's worked example — 0.1 ETH (rate 15) paid with
 * JazzCash PKR (rate 289.38, 1 fixed + 3%) returns payable 2.987076.
 */

/** The wallet-type strings the API expects back, verbatim. */
export const INSIDE_WALLET = "Inside Wallet";
export const OUTSIDE_WALLET = "Outside Wallet";

export interface BuyFigures {
  /** Payment currency per 1 coin. */
  rate: number;
  /** The coin amount being bought. */
  amount: number;
  /** The amount in the payment currency, before charges. */
  convert: number;
  /** The operator's flat charge, in the payment currency. */
  fixedCharge: number;
  percentCharge: number;
  totalCharge: number;
  /** Converted amount + charges — what the user is charged. */
  payable: number;
}

/** A payment method's charge configuration as numbers. `percent` is a percentage. */
export function gatewayFees(gateway: BuyGateway | undefined) {
  return {
    fixed: num(gateway?.fixed_charge),
    percent: num(gateway?.percent_charge),
    minLimit: num(gateway?.min_limit),
    maxLimit: num(gateway?.max_limit),
    rate: num(gateway?.rate),
  };
}

export function buyQuote({
  amount,
  coinRate,
  gatewayRate,
  fees,
}: {
  amount: number;
  coinRate: number;
  gatewayRate: number;
  fees: { fixed: number; percent: number };
}): BuyFigures {
  // Both the coin and the payment currency are quoted against the same base
  // currency, so the price of one in the other is their ratio. A zero coin rate
  // means the coin is unpriced, and an unpriced coin converts to nothing.
  const rate = coinRate > 0 ? gatewayRate / coinRate : 0;

  const convert = amount * rate;
  const fixedCharge = fees.fixed;
  const percentCharge = (convert * fees.percent) / 100;
  const totalCharge = fixedCharge + percentCharge;

  return {
    rate,
    amount,
    convert,
    fixedCharge,
    percentCharge,
    totalCharge,
    payable: convert + totalCharge,
  };
}

/**
 * The order limits in the COIN being bought. `min_limit`/`max_limit` are configured
 * in the payment method's currency, so they divide by the pair's rate to become
 * something the amount field can be compared against.
 */
export function buyLimits(
  fees: { minLimit: number; maxLimit: number },
  rate: number,
): { min: number; max: number } {
  if (rate <= 0) return { min: 0, max: 0 };
  return { min: fees.minLimit / rate, max: fees.maxLimit / rate };
}

/* -------------------------------------------------------------------------- */
/* Reading the index payload                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How a method settles, read off the end of its alias — "…-manual" versus
 * "…-automatic". The operator's alias is the only place this is stated, and it
 * decides which endpoint the confirm button calls.
 */
export function isManualGateway(alias: string | undefined): boolean {
  return /-manual$/i.test(alias ?? "");
}

/**
 * Whether `submit`'s redirect is the API asking US for card details. Authorize.Net
 * has no hosted page: its alias says "automatic" like any other, and the tell is
 * that the URL points back at `authorize-payment-submit`.
 */
export function isAuthorizeRedirect(url: string | undefined): boolean {
  return /authorize-payment-submit/i.test(url ?? "");
}

/** The user's wallet for a coin, if they hold one. Singular on this endpoint. */
export function ownWallet(currency: BuyCurrency | undefined) {
  return currency?.wallet?.[0];
}

export function walletBalance(currency: BuyCurrency | undefined): number {
  return num(ownWallet(currency)?.balance);
}

/** The chains a coin can be delivered over, ignoring rows with nothing to post. */
export function coinNetworks(currency: BuyCurrency | undefined): BuyNetwork[] {
  return (currency?.networks ?? []).filter((network) => network.network_id != null);
}

/**
 * `store` wants `network_id`, so that is a network option's value. Kept beside
 * `coinNetworks` because the two ids are easy to mix up and only one is accepted.
 */
export function networkValue(network: BuyNetwork | undefined): string {
  return network?.network_id != null ? String(network.network_id) : "";
}

/** The first coin worth opening on: one the user already has a wallet for. */
export function defaultCurrency(currencies: BuyCurrency[]): BuyCurrency | undefined {
  return currencies.find((currency) => ownWallet(currency)) ?? currencies[0];
}

/** The wallet-type labels the API sent, falling back to the two it always sends. */
export function walletTypes(types: string[] | undefined): string[] {
  return types?.length ? types : [INSIDE_WALLET, OUTSIDE_WALLET];
}
