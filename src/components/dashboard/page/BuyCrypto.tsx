"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ArrowUpRight,
  ClipboardPaste,
  Clock,
  Coins,
  CreditCard,
  Loader2,
  Receipt,
  RotateCcw,
  Send,
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
  SegmentedChoice,
} from "@/components/dashboard/TradeFields";
import { TextField } from "@/components/dashboard/FormFields";
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
  useAuthorizeSubmit,
  useBuyIndex,
  useManualGatewayFields,
  useManualSubmit,
  useStoreBuy,
  useSubmitBuy,
} from "@/hooks/useBuy";
import { coinBrand } from "@/config/media";
import { coinAmount, num } from "@/config/txlog";
import { toNumber } from "@/config/market";
import { isFieldRequired } from "@/config/kyc";
import {
  OUTSIDE_WALLET,
  buyLimits,
  buyQuote,
  coinNetworks,
  defaultCurrency,
  gatewayFees,
  isAuthorizeRedirect,
  isManualGateway,
  networkValue,
  walletTypes,
} from "@/config/buy";
import type { BuyDraft } from "@/services/buy.service";
import type { KycField, KycValue } from "@/services/kyc.service";

/**
 * Buy Crypto, on live data. Three or four steps, of which the user sees at most three:
 *
 *  1. the form, priced locally by the backend's own rules;
 *  2. `store`'s quote in full — the figures that will actually be charged;
 *  3. what the gateway needs: manual → instructions + proof form, card → we collect
 *     it (Authorize.Net has no hosted page), other → redirect to the gateway.
 *
 * The gateway decides which runs: a `-manual` alias skips `submit` entirely.
 */

const PAGE = "mx-auto w-full max-w-[1280px] p-4 sm:p-6";

/** Shared frame for the amount and address rows, so they read as one set. */
const FIELD = "flex h-13 items-center rounded-xl border bg-surface transition focus-within:ring-2";
const FIELD_OK = "border-border focus-within:border-primary focus-within:ring-primary/20";
const FIELD_BAD = "border-hero-neg focus-within:ring-hero-neg/25";

/** Shortest thing that could plausibly be a chain address. The API is the judge. */
const MIN_ADDRESS = 10;

export function BuyCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`buyCrypto.${name}`);

  const { data, isPending, isError, error, refetch } = useBuyIndex();
  const store = useStoreBuy();
  const submit = useSubmitBuy();

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
  const [address, setAddress] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [touched, setTouched] = useState(false);

  /** The server's quote. Its presence IS the review step. */
  const [draft, setDraft] = useState<BuyDraft | null>(null);
  /** Set once the gateway turns out to be a manual one. */
  const [manual, setManual] = useState(false);
  /** `submit`'s identifier, once the gateway turns out to want a card. */
  const [cardIdentifier, setCardIdentifier] = useState<string | null>(null);

  // The opening selections depend on the payload, so they can only be decided once
  // it is here. Set during render rather than in an effect: an effect would paint
  // one frame with no coin and every field empty.
  if (types.length > 0 && !walletType) setWalletType(types[0]);
  if (currencies.length > 0 && !coinId) setCoinId(String(defaultCurrency(currencies)?.id ?? ""));
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
  const figures = buyQuote({ amount, coinRate: num(coin?.rate), gatewayRate: fees.rate, fees });
  const limits = buyLimits(fees, figures.rate);

  const outside = walletType === OUTSIDE_WALLET;

  // The first thing standing between this form and an order, or null. Config
  // problems show at once; amount and address problems wait for a blur.
  const problem = (() => {
    if (!coin || !gateway) return null;
    if (!network) return k("errorNetwork");
    if (!touched) return null;
    if (amount <= 0) return k("errorAmount");
    if (limits.min > 0 && amount < limits.min)
      return k("errorMin").replace("{min}", coinAmount(limits.min)).replace("{coin}", code);
    if (limits.max > 0 && amount > limits.max)
      return k("errorMax").replace("{max}", coinAmount(limits.max)).replace("{coin}", code);
    if (outside && address.trim().length < MIN_ADDRESS) return k("errorAddress");
    return null;
  })();

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddress(text.trim());
        return;
      }
    } catch {}
    toast.error(k("pasteFailed"));
  }

  function reset() {
    setDraft(null);
    setManual(false);
    setCardIdentifier(null);
    setAmountRaw("");
    setAddress("");
    setTouched(false);
  }

  function review() {
    setTouched(true);
    if (!coin?.id || !gateway?.id || !network?.network_id || !walletType) return;
    if (amount <= 0) return;
    if (limits.min > 0 && amount < limits.min) return;
    if (limits.max > 0 && amount > limits.max) return;
    if (outside && address.trim().length < MIN_ADDRESS) return;

    store.mutate(
      {
        wallet_type: walletType,
        sender_currency: coin.id,
        network: network.network_id,
        amount,
        payment_method: gateway.id,
        wallet_address: outside ? address.trim() : undefined,
      },
      { onSuccess: setDraft },
    );
  }

  /** The confirm button, which is where the three settlement modes part company. */
  function confirm() {
    if (!draft?.identifier) return;

    if (isManualGateway(draft.data?.payment_method?.alias)) {
      setManual(true);
      return;
    }

    submit.mutate(draft.identifier, {
      onSuccess: (result) => {
        // Authorize.Net points back at the API's own endpoint — that is not a page
        // to visit, it is the API asking us for the card.
        if (isAuthorizeRedirect(result.redirect_url)) {
          setCardIdentifier(result.identifier || draft.identifier || null);
          return;
        }
        if (result.redirect_url) {
          toast.success(k("redirecting"));
          window.location.assign(result.redirect_url);
          return;
        }
        // A 200 with nowhere to go cannot be completed here, and pretending
        // otherwise would leave the user waiting on a screen that never changes.
        toast.error(k("gatewayFailed"));
      },
    });
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
  // Each takes the whole page rather than sitting beside a form that is no longer
  // what will run.

  if (draft && cardIdentifier) {
    return (
      <div className={PAGE}>
        {header}
        <CardStep
          draft={draft}
          identifier={cardIdentifier}
          onBack={() => setCardIdentifier(null)}
          onDone={reset}
        />
      </div>
    );
  }

  if (draft && manual) {
    return (
      <div className={PAGE}>
        {header}
        <ManualStep draft={draft} onBack={() => setManual(false)} onDone={reset} />
      </div>
    );
  }

  if (draft) {
    return (
      <div className={PAGE}>
        {header}
        <div className="mx-auto mt-6 w-full max-w-150">
          <ReviewStep
            draft={draft}
            busy={submit.isPending}
            onBack={() => setDraft(null)}
            onConfirm={confirm}
          />
        </div>
      </div>
    );
  }

  /* -------------------------------- Form -------------------------------- */

  const coinOptions: SelectOption[] = currencies.map((currency) => ({
    value: String(currency.id),
    label: (currency.code ?? "").toUpperCase(),
    hint: currency.name,
    icon: <CoinArt currency={currency} paths={coinPaths} size={30} />,
    keywords: currency.name,
  }));

  const networkOptions: SelectOption[] = networks.map((item) => ({
    value: networkValue(item),
    // Two rows of one coin could share a `network_id`; the row id never repeats.
    id: String(item.id ?? networkValue(item)),
    label: item.name ?? "",
    hint:
      item.arrival_time != null
        ? k("arrivalMinutes").replace("{minutes}", String(item.arrival_time))
        : undefined,
  }));

  const methodOptions: SelectOption[] = gateways.map((item) => ({
    value: String(item.id),
    // A manual method says so in the list, because it changes what happens after
    // Confirm: no gateway page, an instruction sheet and a proof of payment
    // instead. Worth knowing BEFORE picking it, not after.
    label: isManualGateway(item.alias) ? `${item.name ?? ""} (${k("manualTag")})` : (item.name ?? ""),
    hint: (item.currency_code ?? "").toUpperCase(),
    icon: <MethodArt gateway={item} paths={payPaths} />,
    keywords: item.currency_code,
  }));

  const busy = store.isPending;

  return (
    <div className={PAGE}>
      {header}

      {/* Form on the left, the order previewed on the right. The button lives with
          the FORM: it acts on what was typed there, and the right column is only
          for reading back. */}
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          {types.length > 1 && (
            <div className="mx-auto w-full max-w-100">
              <SegmentedChoice
                label={k("destination")}
                value={walletType ?? types[0]}
                onChange={setWalletType}
                options={types.map((type) => ({
                  value: type,
                  // The API's wording is English; the labels on screen are ours.
                  label: type === OUTSIDE_WALLET ? k("outsideWallet") : k("insideWallet"),
                  icon:
                    type === OUTSIDE_WALLET ? (
                      <ArrowUpRight size={15} aria-hidden />
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
              />
            </div>

            {/* ---- Network ---- */}
            <div className="min-w-0">
              <FieldLabel hint={k("networkHint")}>{k("selectNetwork")}</FieldLabel>
              <SelectMenu
                label={k("selectNetwork")}
                value={networkValue(network)}
                options={networkOptions}
                onChange={setNetworkId}
                disabled={busy || networkOptions.length === 0}
                placeholder={networkOptions.length === 0 ? k("errorNetwork") : undefined}
              />
            </div>

            {/* ---- Address, only when the coins leave the platform ---- */}
            {outside && (
              <div className="min-w-0 sm:col-span-2">
                <FieldLabel>{k("walletAddress")}</FieldLabel>
                <div
                  className={cn(
                    FIELD,
                    "pr-1.5 pl-3",
                    problem && address.trim().length < MIN_ADDRESS ? FIELD_BAD : FIELD_OK,
                  )}
                >
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder={k("addressPlaceholder")}
                    spellCheck={false}
                    disabled={busy}
                    aria-label={k("walletAddress")}
                    className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-heading outline-none placeholder:font-sans placeholder:text-muted disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={paste}
                    disabled={busy}
                    className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-[12.5px] font-semibold text-primary transition hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ClipboardPaste size={14} aria-hidden />
                    {k("paste")}
                  </button>
                </div>

                <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px]! leading-relaxed! text-amber-700 dark:text-amber-300">
                  <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
                  {k("addressWarning")
                    .replace("{coin}", code)
                    .replace("{network}", network?.name ?? "")}
                </p>
              </div>
            )}

            {/* ---- Amount ---- */}
            <div className="min-w-0">
              <FieldLabel>{k("amount")}</FieldLabel>
              <div className={cn(FIELD, "pl-3.5", problem && amount <= 0 ? FIELD_BAD : FIELD_OK)}>
                <input
                  value={amountRaw}
                  onChange={(e) => setAmountRaw(e.target.value.replace(/[^\d.,]/g, ""))}
                  onBlur={() => setTouched(true)}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={busy}
                  aria-label={k("amount")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold tabular-nums text-heading outline-none placeholder:font-normal placeholder:text-muted disabled:opacity-60"
                />
                {/* The unit, not a button: the coin is chosen in the field above,
                    and a second place to change it is a second thing to keep in
                    sync. */}
                <span className="grid! shrink-0 place-items-center self-stretch rounded-e-xl bg-primary px-3.5 text-[13px]! font-bold! text-white">
                  {code}
                </span>
              </div>

              <Figures
                rows={[
                  [k("minAmount"), `${coinAmount(limits.min)} ${code}`],
                  [k("maxAmount"), `${coinAmount(limits.max)} ${code}`],
                ]}
              />
            </div>

            {/* ---- Payment method ---- */}
            <div className="min-w-0">
              <FieldLabel>{k("paymentMethod")}</FieldLabel>
              <SelectMenu
                label={k("paymentMethod")}
                value={String(gateway.id)}
                options={methodOptions}
                onChange={setMethodId}
                disabled={busy}
                showHintInTrigger={false}
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
              <Line icon={<CreditCard size={15} />} label={k("paymentMethod")}>
                {gateway.name}
              </Line>
              {outside && (
                <Line icon={<Send size={15} />} label={k("walletAddress")}>
                  <span
                    className={cn(
                      "font-mono text-[11.5px]! break-all",
                      address.trim() ? "text-heading" : "text-muted",
                    )}
                  >
                    {address.trim() || "—"}
                  </span>
                </Line>
              )}
              <Line icon={<Coins size={15} />} label={k("enterAmount")}>
                <span className="tabular-nums">
                  {coinAmount(amount)} {code}
                </span>
              </Line>
              <Line icon={<ArrowRightLeft size={15} />} label={k("convertAmount")}>
                <span className="tabular-nums">
                  {coinAmount(figures.convert)} {payCode}
                </span>
              </Line>
              <Line icon={<ArrowRightLeft size={15} />} label={k("exchangeRate")}>
                <span className="tabular-nums">
                  1 {code} = {coinAmount(figures.rate)} {payCode}
                </span>
              </Line>
              <Line icon={<Receipt size={15} />} label={k("feesCharges")}>
                <span className="tabular-nums text-hero-neg">
                  {coinAmount(figures.totalCharge)} {payCode}
                </span>
              </Line>
              {network?.arrival_time != null && (
                <Line icon={<Clock size={15} />} label={k("arrival")}>
                  {k("arrivalMinutes").replace("{minutes}", String(network.arrival_time))}
                </Line>
              )}
              <Line icon={<Wallet size={15} />} label={k("totalPayable")} strong>
                <span className="text-[18px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                  {coinAmount(figures.payable)} {payCode}
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
/* Step two — the server's quote                                               */
/* -------------------------------------------------------------------------- */

/**
 * `store`'s answer, and the button that acts on it. Every figure comes from the
 * response — if the rate moved since typing, the real number appears here first.
 */
function ReviewStep({
  draft,
  busy,
  onBack,
  onConfirm,
}: {
  draft: BuyDraft;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`buyCrypto.${name}`);

  const quote = draft.data;
  const code = (quote?.wallet?.code ?? "").toUpperCase();
  const payCode = (quote?.payment_method?.code ?? "").toUpperCase();
  const brand = coinBrand(code);
  const amount = num(quote?.amount);
  const rate = num(quote?.exchange_rate);

  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="px-1 text-[16px]! font-bold!">{k("previewTitle")}</h2>

      <dl className="mt-3 divide-y divide-border">
        <Line icon={<Wallet size={15} />} label={k("walletType")}>
          {quote?.wallet?.type === OUTSIDE_WALLET ? k("outsideWallet") : k("insideWallet")}
        </Line>
        <Line
          plain
          icon={<CoinBadge color={brand.color} glyph={brand.glyph} size={32} />}
          label={k("coin")}
        >
          {quote?.wallet?.name} ({code})
        </Line>
        <Line icon={<Waypoints size={15} />} label={k("network")}>
          {quote?.network?.name ?? "—"}
        </Line>
        <Line icon={<CreditCard size={15} />} label={k("paymentMethod")}>
          {quote?.payment_method?.name ?? "—"}
        </Line>
        {quote?.wallet?.address && (
          <Line icon={<Send size={15} />} label={k("walletAddress")}>
            <span className="font-mono text-[11.5px]! break-all">{quote.wallet.address}</span>
          </Line>
        )}
        <Line icon={<Coins size={15} />} label={k("enterAmount")}>
          <span className="tabular-nums">
            {coinAmount(amount)} {code}
          </span>
        </Line>
        <Line icon={<ArrowRightLeft size={15} />} label={k("convertAmount")}>
          <span className="tabular-nums">
            {coinAmount(amount * rate)} {payCode}
          </span>
        </Line>
        <Line icon={<ArrowRightLeft size={15} />} label={k("exchangeRate")}>
          <span className="tabular-nums">
            1 {code} = {coinAmount(rate)} {payCode}
          </span>
        </Line>
        <Line icon={<Receipt size={15} />} label={k("feesCharges")}>
          <span className="tabular-nums text-hero-neg">
            {coinAmount(quote?.total_charge)} {payCode}
          </span>
        </Line>
        <Line icon={<Coins size={15} />} label={k("willGet")}>
          <span className="tabular-nums text-hero-mint">
            {coinAmount(quote?.will_get)} {code}
          </span>
        </Line>
        <Line icon={<Wallet size={15} />} label={k("totalPayable")} strong>
          <span className="text-[19px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
            {coinAmount(quote?.payable_amount)} {payCode}
          </span>
        </Line>
      </dl>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="btn-lift inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 size={16} aria-hidden className="animate-spin" />
              {k("confirming")}
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
  );
}

/* -------------------------------------------------------------------------- */
/* Step three (a) — the manual gateway                                         */
/* -------------------------------------------------------------------------- */

/**
 * The operator's instructions, and the form they want back. Both are data: `desc`
 * is their HTML, `input_fields` declares the controls (same shape as KYC).
 */
function ManualStep({
  draft,
  onBack,
  onDone,
}: {
  draft: BuyDraft;
  onBack: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`buyCrypto.${name}`);

  const alias = draft.data?.payment_method?.alias ?? "";
  const { data, isPending, isError, error, refetch } = useManualGatewayFields(alias);
  const send = useManualSubmit(k("manualSuccess"));

  const [values, setValues] = useState<Record<string, KycValue>>({});
  const [submitted, setSubmitted] = useState(false);

  const fields = useMemo(() => data?.input_fields ?? [], [data]);

  /** Required-only: the API owns the real rules and answers with them. */
  const missing = fields.filter((field) => {
    if (!isFieldRequired(field)) return false;
    const value = values[field.name];
    return value instanceof File ? false : !String(value ?? "").trim();
  });

  function submit() {
    setSubmitted(true);
    if (missing.length > 0 || !draft.identifier) return;
    send.mutate({ identifier: draft.identifier, values }, { onSuccess: onDone });
  }

  const shown = (field: KycField) =>
    submitted && missing.some((item) => item.name === field.name) ? k("errorRequired") : null;

  return (
    <div className="mx-auto mt-6 w-full max-w-180">
      <Panel className="p-4 sm:p-6">
        <h2 className="text-[16px]! font-bold!">{k("manualTitle")}</h2>
        <p className="mt-1 text-[12.5px]! text-muted">
          {draft.data?.payment_method?.name} ·{" "}
          <span className="font-semibold tabular-nums text-heading">
            {coinAmount(draft.data?.payable_amount)}{" "}
            {(draft.data?.payment_method?.code ?? "").toUpperCase()}
          </span>
        </p>

        {isPending && (
          <div className="mt-6 flex items-center gap-2 text-[13px]! text-muted">
            <Loader2 size={16} aria-hidden className="animate-spin" />
            {k("reviewing")}
          </div>
        )}

        {isError && (
          <div className="mt-6">
            <p className="flex items-start gap-1.5 text-[12.5px]! leading-snug! text-hero-neg">
              <TriangleAlert size={13} aria-hidden className="mt-0.5 shrink-0" />
              {getApiErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-[13px] font-semibold text-heading transition hover:border-primary"
            >
              <RotateCcw size={14} aria-hidden />
              {k("retry")}
            </button>
          </div>
        )}

        {!isPending && !isError && (
          <>
            {/* The operator's own instructions, in their own HTML — so they get a
                container that styles headings, lists and links rather than
                free-floating markup. */}
            {data?.gateway?.desc && (
              <div
                className="mt-4 rounded-2xl border border-border bg-surface p-4 text-[13px]! leading-relaxed! text-body [&_a]:text-primary [&_a]:underline [&_li]:mt-1 [&_ol]:mt-1.5 [&_p]:mt-2 [&_strong]:font-bold [&_strong]:text-heading [&_ul]:mt-1.5"
                dangerouslySetInnerHTML={{ __html: data.gateway.desc }}
              />
            )}

            {fields.length === 0 ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px]! leading-relaxed! text-amber-700 dark:text-amber-300">
                <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
                {k("noFields")}
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <DynamicField
                    key={field.name}
                    field={field}
                    value={values[field.name] ?? null}
                    error={shown(field)}
                    ns="buyCrypto"
                    onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                type="button"
                onClick={submit}
                disabled={send.isPending || fields.length === 0}
                className="btn-lift inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {send.isPending ? (
                  <>
                    <Loader2 size={16} aria-hidden className="animate-spin" />
                    {k("submitting")}
                  </>
                ) : (
                  k("manualSubmit")
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={send.isPending}
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-[14px] font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-28"
              >
                {k("back")}
              </button>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step three (b) — the card                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The card form, for the one gateway with no hosted page.
 *
 * The identifier posted here is `submit`'s, not the draft's. Nothing is stored,
 * and `autoComplete="off"` keeps the browser out of it too.
 */
function CardStep({
  draft,
  identifier,
  onBack,
  onDone,
}: {
  draft: BuyDraft;
  identifier: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`buyCrypto.${name}`);

  const pay = useAuthorizeSubmit(k("cardSuccess"));

  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const digits = number.replace(/\D/g, "");
  const valid =
    digits.length >= 13 &&
    digits.length <= 19 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    code.length >= 3;

  function submit() {
    setSubmitted(true);
    if (!valid) return;
    pay.mutate({ identifier, card_number: digits, date: expiry, code }, { onSuccess: onDone });
  }

  const quote = draft.data;
  const coinCode = (quote?.wallet?.code ?? "").toUpperCase();
  const payCode = (quote?.payment_method?.code ?? "").toUpperCase();

  return (
    <div className="mt-6">
      <h2 className="text-[16px]! font-bold!">{k("cardTitle")}</h2>

      <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- The card ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <h3 className="text-center text-[15px]! font-bold!">{k("payWithCard")}</h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField
              required
              label={k("cardNumber")}
              value={number}
              // Grouped in fours as it is typed: a 16-digit run is unreadable, and
              // the digits are stripped again before they are posted.
              onChange={(next) =>
                setNumber(
                  next
                    .replace(/\D/g, "")
                    .slice(0, 19)
                    .replace(/(.{4})/g, "$1 ")
                    .trim(),
                )
              }
              placeholder="1234 1234 1234 1234"
              inputMode="numeric"
              autoComplete="off"
              className="sm:col-span-2"
            />

            <TextField
              required
              label={k("cardExpiry")}
              value={expiry}
              // "YY/MM", which is the order the endpoint's own example posts.
              onChange={(next) => {
                const raw = next.replace(/\D/g, "").slice(0, 4);
                setExpiry(raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw);
              }}
              placeholder="YY / MM"
              inputMode="numeric"
              autoComplete="off"
            />

            <TextField
              required
              label={k("cardCvv")}
              value={code}
              onChange={(next) => setCode(next.replace(/\D/g, "").slice(0, 4))}
              placeholder="CVC"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          {submitted && !valid && (
            <p className="mt-4 flex items-start gap-1.5 text-[12.5px]! leading-snug! text-hero-neg">
              <TriangleAlert size={13} aria-hidden className="mt-0.5 shrink-0" />
              {k("errorCard")}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
            <button
              type="button"
              onClick={submit}
              disabled={pay.isPending}
              className="btn-lift inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pay.isPending ? (
                <>
                  <Loader2 size={16} aria-hidden className="animate-spin" />
                  {k("submitting")}
                </>
              ) : (
                k("cardSubmit")
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={pay.isPending}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-[14px] font-semibold text-heading transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-28"
            >
              {k("back")}
            </button>
          </div>

          <p className="mt-3 flex items-start gap-2 text-[11.5px]! leading-relaxed! text-muted">
            <ShieldCheck size={14} aria-hidden className="mt-px shrink-0 text-hero-mint" />
            {k("cardNote")}
          </p>
        </Panel>

        {/* ---- What is being charged ---- */}
        <div className="lg:col-span-5">
          <Panel className="p-4 sm:p-5">
            <h3 className="px-1 text-[15px]! font-bold!">{k("paymentInfo")}</h3>

            <dl className="mt-3 divide-y divide-border">
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
                  {coinAmount(quote?.total_charge)} {payCode}
                </span>
              </Line>
              <Line icon={<Coins size={15} />} label={k("willGet")}>
                <span className="tabular-nums text-hero-mint">
                  {coinAmount(quote?.will_get)} {coinCode}
                </span>
              </Line>
              <Line icon={<Wallet size={15} />} label={k("totalPayable")} strong>
                <span className="text-[18px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                  {coinAmount(quote?.payable_amount)} {payCode}
                </span>
              </Line>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
