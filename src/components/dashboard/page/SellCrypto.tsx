"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  ArrowRightLeft,
  ArrowUpFromLine,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Loader2,
  Receipt,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
  Waypoints,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import {
  FieldLabel,
  Figures,
  LiveRatePill,
  PercentChips,
  SegmentedChoice,
} from "@/components/dashboard/TradeFields";
import {
  CoinArt,
  DynamicField,
  MethodArt,
  StatePanel,
  SummaryLine as Line,
} from "@/components/dashboard/OrderPieces";
import { TradeSkeleton } from "@/components/dashboard/Skeletons";
import { getApiErrorMessage } from "@/hooks/useAuth";
import {
  useConfirmSell,
  usePaymentInfoStore,
  useSellIndex,
  useSellPaymentStore,
  useStoreSell,
} from "@/hooks/useSell";
import { coinBrand } from "@/config/media";
import { coinAmount, num } from "@/config/txlog";
import { PERCENTS, floor8, toNumber } from "@/config/market";
import { isFieldRequired } from "@/config/kyc";
import {
  OUTSIDE_WALLET,
  buyLimits,
  coinNetworks,
  gatewayFees,
  networkValue,
  walletTypes,
} from "@/config/buy";
import { defaultSellCurrency, maxSellable, outsideAddressFor, sellQuote } from "@/config/sell";
import type { SellDraft, SellStoreResult } from "@/services/sell.service";
import type { KycField, KycValue } from "@/services/kyc.service";

/**
 * Sell Crypto, on live data. Where the coins come from decides the screens:
 *
 *  Inside Wallet   form → receiving details → done
 *  Outside Wallet  form → send the coins → receiving details → done
 *
 * The extra screen is a deposit address claimed by `sell-payment-store`. The
 * receiving form is the operator's own and arrives with `store`; when the coins
 * came from outside, the address's `input_fields` are appended and both sets post
 * together. Charges are taken in the COIN, on top of the amount.
 */

const PAGE = "mx-auto w-full max-w-[1280px] p-4 sm:p-6";

/** Shared frame for the amount row, so it matches the selects beside it. */
const FIELD = "flex h-13 items-center rounded-xl border bg-surface transition focus-within:ring-2";
const FIELD_OK = "border-border focus-within:border-primary focus-within:ring-primary/20";
const FIELD_BAD = "border-hero-neg focus-within:ring-hero-neg/25";

export function SellCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`sellCrypto.${name}`);

  const { data, isPending, isError, error, refetch } = useSellIndex();
  const store = useStoreSell();
  const claim = useSellPaymentStore();

  const currencies = data?.currencies ?? [];
  const gateways = data?.payment_gateway ?? [];
  const types = walletTypes(data?.wallet_type);
  const coinPaths = data?.currency_image_paths;
  const payPaths = data?.payment_image_paths;

  const [walletType, setWalletType] = useState<string | null>(null);
  const [coinId, setCoinId] = useState<string | null>(null);
  /** A network's `network_id`, as a string — what `store` wants. */
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState("");
  const [touched, setTouched] = useState(false);

  /** `store`'s answer: the quote AND the payout form to fill in. */
  const [result, setResult] = useState<SellStoreResult | null>(null);
  /** The draft once a deposit address has been claimed for it. */
  const [claimed, setClaimed] = useState<SellDraft | null>(null);
  /** Set once the user has seen the deposit address and moved on. */
  const [sent, setSent] = useState(false);

  // The opening selections depend on the payload, so they can only be decided once
  // it is here. Set during render rather than in an effect: an effect would paint
  // one frame with no coin and every field empty.
  if (types.length > 0 && !walletType) setWalletType(types[0]);
  if (currencies.length > 0 && !coinId) {
    setCoinId(String(defaultSellCurrency(currencies)?.id ?? ""));
  }
  if (gateways.length > 0 && !methodId) setMethodId(String(gateways[0]?.id ?? ""));

  const coin = currencies.find((item) => String(item.id) === coinId) ?? currencies[0];
  const networks = coinNetworks(coin);
  // Falls back rather than resetting: the coin can change under this, and a network
  // id belonging to the previous coin simply stops matching.
  const network = networks.find((item) => networkValue(item) === networkId) ?? networks[0];
  const gateway = gateways.find((item) => String(item.id) === methodId) ?? gateways[0];

  const code = (coin?.code ?? "").toUpperCase();
  const payCode = (gateway?.currency_code ?? "").toUpperCase();

  const fees = gatewayFees(gateway);
  const amount = toNumber(amountRaw);
  const figures = sellQuote({ amount, coinRate: num(coin?.rate), gatewayRate: fees.rate, fees });
  const limits = buyLimits(fees, figures.rate);

  const outside = walletType === OUTSIDE_WALLET;
  const balance = num(coin?.wallet?.[0]?.balance);
  /** Coins sold from outside are bounded by the order limit, not by a balance. */
  const sellable = outside
    ? floor8(limits.max)
    : maxSellable({ balance, rate: figures.rate, fees });

  /** The deposit address for this pair, for an outside sale. */
  const address = outsideAddressFor(data?.outside_wallet_address, coin?.id, network?.network_id);

  // The first thing standing between this form and an order, or null. Config
  // problems show at once; amount problems wait for a blur.
  const problem = (() => {
    if (!coin || !gateway) return null;
    if (!network) return k("errorNetwork");
    if (outside && !address) return k("noAddress");
    if (!touched) return null;
    if (amount <= 0) return k("errorAmount");
    if (limits.min > 0 && amount < limits.min)
      return k("errorMin").replace("{min}", coinAmount(limits.min)).replace("{coin}", code);
    if (limits.max > 0 && amount > limits.max)
      return k("errorMax").replace("{max}", coinAmount(limits.max)).replace("{coin}", code);
    if (!outside && figures.payable > balance)
      return k("errorBalance").replace("{balance}", coinAmount(balance)).replace("{coin}", code);
    return null;
  })();

  function setPercent(pct: number) {
    // Divided out of the SELLABLE figure, not the balance: the fee is charged on
    // top, so a Max taken from the balance itself could only ever be rejected.
    setAmountRaw(coinAmount(floor8((sellable * pct) / 100)).replace(/,/g, ""));
    setTouched(true);
  }

  function reset() {
    setResult(null);
    setClaimed(null);
    setSent(false);
    setAmountRaw("");
    setTouched(false);
  }

  function review() {
    setTouched(true);
    if (!coin?.id || !gateway?.id || !network?.network_id || !walletType) return;
    if (outside && !address?.slug) return;
    if (amount <= 0) return;
    if (limits.min > 0 && amount < limits.min) return;
    if (limits.max > 0 && amount > limits.max) return;
    if (!outside && figures.payable > balance) return;

    store.mutate(
      {
        wallet_type: walletType,
        sender_currency: coin.id,
        network: network.network_id,
        amount,
        payment_method: gateway.id,
      },
      {
        onSuccess: (stored) => {
          setResult(stored);
          // An outside sale needs somewhere to send the coins, and that is a second
          // call — made straight away, so the user meets the address rather than a
          // button that fetches it.
          const identifier = stored.data?.identifier;
          if (outside && identifier && address?.slug) {
            claim.mutate(
              { identifier, slug: address.slug },
              { onSuccess: setClaimed },
            );
          }
        },
      },
    );
  }

  const header = (
    <DashPageHeader
      title={k("title")}
      subtitle={k("subtitle")}
      action={
        coin && gateway && figures.rate > 0 ? (
          <LiveRatePill label={k("liveRate")}>
            1 {code} = {coinAmount(figures.rate)} {payCode}
          </LiveRatePill>
        ) : undefined
      }
    />
  );

  if (isPending) {
    return (
      <div className={PAGE}>
        {header}
        <TradeSkeleton header={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={PAGE}>
        {header}
        <StatePanel tone="bad" icon={<TriangleAlert size={20} />} title={k("loadFailed")}>
          {getApiErrorMessage(error)}
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
          >
            <RotateCcw size={15} aria-hidden />
            {k("retry")}
          </button>
        </StatePanel>
      </div>
    );
  }

  if (!coin || !gateway) {
    return (
      <div className={PAGE}>
        {header}
        <StatePanel icon={<Wallet size={20} />} title={k("noCoins")}>
          {k("noCoinsDesc")}
        </StatePanel>
      </div>
    );
  }

  /* ----------------------------- Later steps ----------------------------- */

  const draft = claimed ?? result?.data;

  // Outside, before the coins have been sent: the address and the exact amount.
  if (result && outside && !sent) {
    return (
      <div className={PAGE}>
        {header}
        <PaymentStep
          draft={draft}
          busy={claim.isPending}
          onBack={reset}
          onContinue={() => setSent(true)}
        />
      </div>
    );
  }

  // Both flows end here: where the money goes, and the proof of the transfer.
  if (result?.data?.identifier) {
    return (
      <div className={PAGE}>
        {header}
        <ReceivingStep
          identifier={result.data.identifier}
          draft={draft}
          desc={result.desc}
          fields={result.payment_gateway_fields ?? []}
          // Only an outside sale has a transfer to prove.
          addressFields={outside ? (address?.input_fields ?? []) : []}
          onBack={() => (outside ? setSent(false) : reset())}
          onDone={reset}
        />
      </div>
    );
  }

  /* -------------------------------- Form -------------------------------- */

  const coinOptions: SelectOption[] = currencies.map((currency) => ({
    value: String(currency.id),
    label: (currency.code ?? "").toUpperCase(),
    hint: currency.name,
    // On the selling side the balance is the deciding fact.
    meta: coinAmount(currency.wallet?.[0]?.balance ?? 0),
    icon: <CoinArt currency={currency} paths={coinPaths} size={30} />,
    keywords: currency.name,
  }));

  const networkOptions: SelectOption[] = networks.map((item) => ({
    value: networkValue(item),
    id: String(item.id ?? networkValue(item)),
    label: item.name ?? "",
    hint:
      item.arrival_time != null
        ? k("arrivalMinutes").replace("{minutes}", String(item.arrival_time))
        : undefined,
  }));

  const methodOptions: SelectOption[] = gateways.map((item) => ({
    value: String(item.id),
    label: item.name ?? "",
    hint: (item.currency_code ?? "").toUpperCase(),
    icon: <MethodArt gateway={item} paths={payPaths} />,
    keywords: item.currency_code,
  }));

  const busy = store.isPending || claim.isPending;

  return (
    <div className={PAGE}>
      {header}

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Form ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          {types.length > 1 && (
            <div className="mx-auto w-full max-w-100">
              <SegmentedChoice
                label={k("source")}
                value={walletType ?? types[0]}
                onChange={setWalletType}
                options={types.map((type) => ({
                  value: type,
                  // The API's wording is English; the labels on screen are ours.
                  label: type === OUTSIDE_WALLET ? k("outsideWallet") : k("insideWallet"),
                  icon:
                    type === OUTSIDE_WALLET ? (
                      <ArrowUpFromLine size={15} aria-hidden />
                    ) : (
                      <Wallet size={15} aria-hidden />
                    ),
                }))}
              />
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* ---- Coin ---- */}
            <div className="min-w-0">
              <FieldLabel>{k("selectCoin")}</FieldLabel>
              <SelectMenu
                searchable
                label={k("selectCoin")}
                searchPlaceholder={k("searchCoin")}
                emptyText={k("noCoin")}
                value={String(coin.id)}
                options={coinOptions}
                disabled={busy}
                onChange={(next) => {
                  setCoinId(next);
                  // The chains are per coin, so the previous choice is meaningless
                  // now — clear it and let the fallback take the new coin's first.
                  setNetworkId(null);
                }}
                showHintInTrigger={false}
                showMetaInTrigger={false}
              />
            </div>

            {/* ---- Network ---- */}
            <div className="min-w-0">
              <FieldLabel hint={k("networkHint")}>{k("network")}</FieldLabel>
              <SelectMenu
                label={k("network")}
                value={networkValue(network)}
                options={networkOptions}
                onChange={setNetworkId}
                disabled={busy || networkOptions.length === 0}
                placeholder={networkOptions.length === 0 ? k("errorNetwork") : undefined}
              />
            </div>

            {/* ---- Amount ---- */}
            <div className="min-w-0">
              <FieldLabel>{k("youSell")}</FieldLabel>
              <div className={cn(FIELD, "pl-3.5", problem && amount <= 0 ? FIELD_BAD : FIELD_OK)}>
                <input
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value.replace(/[^\d.,]/g, ""))}
                  onBlur={() => setTouched(true)}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={busy}
                  aria-label={k("youSell")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold tabular-nums text-heading outline-none placeholder:font-normal placeholder:text-muted disabled:opacity-60"
                />
                {/* The unit, not a button: the coin is chosen in the field above,
                    and a second place to change it is a second thing to keep in
                    sync. */}
                <span className="grid! shrink-0 place-items-center self-stretch rounded-e-xl bg-primary px-3.5 text-[13px]! font-bold! text-white">
                  {code}
                </span>
              </div>

              {/* A sale is bounded by what there is to sell, so the chips divide
                  THAT figure rather than the order limit. */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px]! text-muted">
                  {k(outside ? "sellableMax" : "balance")}:{" "}
                  <span className="font-semibold tabular-nums text-heading">
                    {coinAmount(sellable)} {code}
                  </span>
                </span>
                <PercentChips percents={PERCENTS} maxLabel={k("max")} onPick={setPercent} />
              </div>
            </div>

            {/* ---- Payout method ---- */}
            <div className="min-w-0">
              <FieldLabel>{k("payoutMethod")}</FieldLabel>
              <SelectMenu
                label={k("payoutMethod")}
                value={String(gateway.id)}
                options={methodOptions}
                onChange={setMethodId}
                disabled={busy}
                showHintInTrigger={false}
              />

              <Figures
                rows={[
                  [k("minAmount"), `${coinAmount(limits.min)} ${code}`],
                  [k("maxAmount"), `${coinAmount(limits.max)} ${code}`],
                ]}
              />
            </div>
          </div>

          {problem && (
            <p className="mt-4 flex items-start gap-1.5 text-[12.5px]! leading-snug! text-hero-neg">
              <TriangleAlert size={13} aria-hidden className="mt-0.5 shrink-0" />
              {problem}
            </p>
          )}

          <button
            type="button"
            onClick={review}
            disabled={busy}
            className="btn-lift mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 size={16} aria-hidden className="animate-spin" />
                {k("reviewing")}
              </>
            ) : (
              k("continue")
            )}
          </button>

          <p className="mt-3 flex items-start gap-2 text-[11.5px]! leading-relaxed! text-muted">
            <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-hero-mint" />
            {k("secured")}
          </p>
        </Panel>

        {/* ------------------------- Preview ------------------------- */}
        {/* Priced locally by the same rules the backend uses. From `store` onwards
            the SERVER's figures replace these. */}
        <div className="lg:sticky lg:top-6 lg:col-span-5">
          <Panel className="p-4 sm:p-5">
            <h2 className="px-1 text-[16px]! font-bold!">{k("summary")}</h2>

            <dl className="mt-3 divide-y divide-border">
              <Line icon={<Wallet size={15} />} label={k("walletType")}>
                {outside ? k("outsideWallet") : k("insideWallet")}
              </Line>
              <Line
                plain
                icon={<CoinArt currency={coin} paths={coinPaths} size={32} />}
                label={k("coin")}
              >
                {coin.name} ({code})
              </Line>
              <Line icon={<Waypoints size={15} />} label={k("network")}>
                {network?.name ?? "—"}
              </Line>
              <Line icon={<CreditCard size={15} />} label={k("payoutMethod")}>
                {gateway.name}
              </Line>
              <Line icon={<Coins size={15} />} label={k("enterAmount")}>
                <span className="tabular-nums">
                  {coinAmount(amount)} {code}
                </span>
              </Line>
              <Line icon={<ArrowRightLeft size={15} />} label={k("exchangeRate")}>
                <span className="tabular-nums">
                  1 {code} = {coinAmount(figures.rate)} {payCode}
                </span>
              </Line>
              <Line icon={<Receipt size={15} />} label={k("feesCharges")}>
                <span className="tabular-nums text-hero-neg">
                  {coinAmount(figures.totalCharge)} {code}
                </span>
              </Line>
              {network?.arrival_time != null && (
                <Line icon={<Clock size={15} />} label={k("arrival")}>
                  {k("arrivalMinutes").replace("{minutes}", String(network.arrival_time))}
                </Line>
              )}
              <Line icon={<Wallet size={15} />} label={k("totalPayable")}>
                <span className="tabular-nums">
                  {coinAmount(figures.payable)} {code}
                </span>
              </Line>
              <Line icon={<Coins size={15} />} label={k("willGet")} strong>
                <span className="text-[18px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                  {coinAmount(figures.willGet)} {payCode}
                </span>
              </Line>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Outside only — send the coins                                               */
/* -------------------------------------------------------------------------- */

/**
 * The deposit address claimed for this order, and the exact amount to send.
 * Copyable and a QR, since this step happens in another application.
 */
function PaymentStep({
  draft,
  busy,
  onBack,
  onContinue,
}: {
  draft: SellDraft | undefined;
  busy: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`sellCrypto.${name}`);

  const quote = draft?.data;
  const code = (quote?.sender_wallet?.code ?? "").toUpperCase();
  const payCode = (quote?.payment_method?.code ?? "").toUpperCase();
  const address = quote?.outside_address?.public_address ?? "";
  // The figure to send is the payable one — amount plus the charges taken in coin.
  const payable = coinAmount(quote?.total_payable).replace(/,/g, "");

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
      return;
    } catch {}
    toast.error(k("copyFailed"));
  }

  return (
    <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      <Panel className="p-4 sm:p-6 lg:col-span-7">
        <h2 className="text-[16px]! font-bold!">{k("paymentTitle")}</h2>
        <p className="mt-1 text-[12.5px]! leading-relaxed! text-muted">{k("paymentNote")}</p>

        {busy && (
          <div className="mt-6 flex items-center gap-2 text-[13px]! text-muted">
            <Loader2 size={16} aria-hidden className="animate-spin" />
            {k("reviewing")}
          </div>
        )}

        {!busy && address && (
          <>
            {/* White plate under the QR in both themes: a dark-on-dark code is one
                many camera apps will not read. */}
            <div className="mt-5 flex justify-center">
              <div className="rounded-2xl bg-white p-3.5 shadow-sm">
                <QRCode
                  value={address}
                  size={168}
                  bgColor="#ffffff"
                  fgColor="#091628"
                  className="h-auto! w-full! max-w-42"
                />
              </div>
            </div>

            <CopyRow
              label={k("sendAddress")}
              value={address}
              mono
              onCopy={() => copy(address, k("copied"))}
            />
            <CopyRow
              label={k("sendAmount")}
              value={`${payable} ${code}`}
              onCopy={() => copy(payable, k("amountCopied"))}
            />
          </>
        )}

        {!busy && !address && (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px]! leading-relaxed! text-amber-700 dark:text-amber-300">
            <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
            {k("noAddress")}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onContinue}
            disabled={busy || !address}
            className="btn-lift inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {k("continue")}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-[14px] font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-28"
          >
            {k("back")}
          </button>
        </div>
      </Panel>

      <div className="lg:col-span-5">
        <QuotePanel draft={draft} title={k("txSummary")} coinCode={code} payCode={payCode} />
      </div>
    </div>
  );
}

/** A value the user has to carry into another app: shown in full, with a copy. */
function CopyRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface p-3.5">
      <span className="block text-[11.5px]! text-muted">{label}</span>
      <div className="mt-1.5 flex items-start gap-2">
        <span
          className={cn(
            "min-w-0 flex-1 text-[13px]! leading-relaxed! break-all text-heading",
            mono ? "font-mono" : "font-semibold tabular-nums",
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-[12px] font-semibold text-primary transition hover:bg-primary/18"
        >
          <Copy size={13} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Both flows — where the money goes                                           */
/* -------------------------------------------------------------------------- */

/**
 * The operator's payout form, and the last button in the flow.
 *
 * All data: `desc` is their HTML, `fields` the payout method's declaration, and
 * `addressFields` the proof the deposit address asks for. Both sets post in one
 * call, then `confirm` places the order — chained behind one button.
 */
function ReceivingStep({
  identifier,
  draft,
  desc,
  fields,
  addressFields,
  onBack,
  onDone,
}: {
  identifier: string;
  draft: SellDraft | undefined;
  desc: string | undefined;
  fields: KycField[];
  addressFields: KycField[];
  onBack: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`sellCrypto.${name}`);

  const info = usePaymentInfoStore();
  const confirm = useConfirmSell(k("success"));

  const [values, setValues] = useState<Record<string, KycValue>>({});
  const [submitted, setSubmitted] = useState(false);

  // The proof of the transfer first: it is about the step just completed, while the
  // payout details are about what happens next.
  const all = useMemo(() => [...addressFields, ...fields], [addressFields, fields]);

  /** Required-only: the API owns the real rules and answers with them. */
  const missing = all.filter((field) => {
    if (!isFieldRequired(field)) return false;
    const value = values[field.name];
    return value instanceof File ? false : !String(value ?? "").trim();
  });

  const busy = info.isPending || confirm.isPending;

  function submit() {
    setSubmitted(true);
    if (missing.length > 0) return;
    info.mutate(
      { identifier, values },
      { onSuccess: () => confirm.mutate(identifier, { onSuccess: onDone }) },
    );
  }

  const shown = (field: KycField) =>
    submitted && missing.some((item) => item.name === field.name) ? k("errorRequired") : null;

  const quote = draft?.data;
  const code = (quote?.sender_wallet?.code ?? "").toUpperCase();
  const payCode = (quote?.payment_method?.code ?? "").toUpperCase();

  return (
    <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      <Panel className="p-4 sm:p-6 lg:col-span-7">
        <h2 className="text-[16px]! font-bold!">{k("receivingTitle")}</h2>
        <p className="mt-1 text-[12.5px]! leading-relaxed! text-muted">{k("receivingNote")}</p>

        {/* The operator's own instructions, in their own HTML — so they get a
            container that styles headings, lists and links rather than
            free-floating markup. */}
        {desc && (
          <div
            className="mt-4 rounded-2xl border border-border bg-surface p-4 text-[13px]! leading-relaxed! text-body [&_a]:text-primary [&_a]:underline [&_li]:mt-1 [&_ol]:mt-1.5 [&_p]:mt-2 [&_strong]:font-bold [&_strong]:text-heading [&_ul]:mt-1.5"
            dangerouslySetInnerHTML={{ __html: desc }}
          />
        )}

        {all.length === 0 ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px]! leading-relaxed! text-amber-700 dark:text-amber-300">
            <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
            {k("noFields")}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {all.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={values[field.name] ?? null}
                error={shown(field)}
                ns="sellCrypto"
                onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={submit}
            disabled={busy || all.length === 0}
            className="btn-lift inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <>
                <Loader2 size={16} aria-hidden className="animate-spin" />
                {k("submitting")}
              </>
            ) : (
              k("confirm")
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-[14px] font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-28"
          >
            {k("back")}
          </button>
        </div>
      </Panel>

      <div className="lg:col-span-5">
        <QuotePanel draft={draft} title={k("txSummary")} coinCode={code} payCode={payCode} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared by both later screens                                                */
/* -------------------------------------------------------------------------- */

/** The server's figures, read back. No control on this side — it is for checking. */
function QuotePanel({
  draft,
  title,
  coinCode,
  payCode,
}: {
  draft: SellDraft | undefined;
  title: string;
  coinCode: string;
  payCode: string;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`sellCrypto.${name}`);

  const quote = draft?.data;
  const brand = coinBrand(coinCode);

  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="px-1 text-[16px]! font-bold!">{title}</h2>

      <dl className="mt-3 divide-y divide-border">
        <Line icon={<Wallet size={15} />} label={k("walletType")}>
          {quote?.sender_wallet?.type === OUTSIDE_WALLET ? k("outsideWallet") : k("insideWallet")}
        </Line>
        <Line
          plain
          icon={<CoinBadge color={brand.color} glyph={brand.glyph} size={32} />}
          label={k("coin")}
        >
          {quote?.sender_wallet?.name} ({coinCode})
        </Line>
        <Line icon={<Waypoints size={15} />} label={k("network")}>
          {quote?.network?.name ?? "—"}
        </Line>
        <Line icon={<CreditCard size={15} />} label={k("payoutMethod")}>
          {quote?.payment_method?.name ?? "—"}
        </Line>
        <Line icon={<Coins size={15} />} label={k("enterAmount")}>
          <span className="tabular-nums">
            {coinAmount(quote?.amount)} {coinCode}
          </span>
        </Line>
        <Line icon={<ArrowRightLeft size={15} />} label={k("exchangeRate")}>
          <span className="tabular-nums">
            1 {coinCode} = {coinAmount(quote?.exchange_rate)} {payCode}
          </span>
        </Line>
        <Line icon={<Receipt size={15} />} label={k("feesCharges")}>
          <span className="tabular-nums text-hero-neg">
            {coinAmount(quote?.total_charge)} {coinCode}
          </span>
        </Line>
        <Line icon={<Wallet size={15} />} label={k("totalPayable")}>
          <span className="tabular-nums">
            {coinAmount(quote?.total_payable)} {coinCode}
          </span>
        </Line>
        <Line icon={<Coins size={15} />} label={k("willGet")} strong>
          <span className="text-[18px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums text-hero-mint">
            {coinAmount(quote?.will_get)} {payCode}
          </span>
        </Line>
      </dl>
    </Panel>
  );
}
