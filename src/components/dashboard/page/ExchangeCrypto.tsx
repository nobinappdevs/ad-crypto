"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import { AmountField, LiveRatePill, PercentChips, Row } from "@/components/dashboard/TradeFields";
import { ExchangeSkeleton } from "@/components/dashboard/Skeletons";
import { getApiErrorMessage } from "@/hooks/useAuth";
import { useConfirmExchange, useExchangeIndex, useStoreExchange } from "@/hooks/useExchange";
import { coinBrand, imageUrl } from "@/config/media";
import { coinAmount, num } from "@/config/txlog";
import { PERCENTS, crypto, floor8, toNumber } from "@/config/market";
import {
  currencyKey,
  defaultPair,
  exchangeFees,
  exchangeLimits,
  exchangeQuote,
  maxSendable,
  ownWallet,
  walletBalance,
} from "@/config/exchange";
import type { ImagePaths } from "@/services/dashboard.service";
import type { ExchangeCurrency, ExchangeDraft } from "@/services/exchange.service";

/**
 * Exchange Crypto — the same shape as Buy, Sell and Withdraw, on live data.
 *
 * The form carries exactly what the old exchange screen carried: the pair's rate,
 * the two amounts, a Max fill, the available balance, the order limits and the
 * network fee. What is new is where those figures come from — `GET
 * /user/exchange-crypto/index` rather than demo constants — and the step that
 * follows.
 *
 * The API prices a swap in two calls: `store` quotes and drafts it, `confirm`
 * executes it. So the page previews the order locally while the user types (by
 * the same rules the backend uses), and on submit turns over to the SERVER's
 * quote. Only the button under those numbers spends anything.
 */

export function ExchangeCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`exchangeCrypto.${name}`);

  const { data, isPending, isError, error, refetch } = useExchangeIndex();
  const store = useStoreExchange();
  const confirm = useConfirmExchange(k("success"));

  const currencies = data?.currencies ?? [];
  const paths = data?.currency_image_paths;
  const fees = exchangeFees(data?.transaction_fees);

  const [pair, setPair] = useState<{ from: string; to: string } | null>(null);
  const [amountRaw, setAmountRaw] = useState("");
  const [touched, setTouched] = useState(false);
  /** The server's quote, once there is one. Its presence IS the review step. */
  const [draft, setDraft] = useState<ExchangeDraft | null>(null);

  // The opening pair depends on which wallets have a balance, so it can only be
  // decided once the payload is here. Set during render rather than in an effect:
  // an effect would paint one frame with no pair and the fields empty.
  if (currencies.length > 0 && !pair) setPair(defaultPair(currencies));

  const from = currencies.find((c) => currencyKey(c) === pair?.from) ?? currencies[0];
  const to =
    currencies.find((c) => currencyKey(c) === pair?.to) ??
    currencies.find((c) => currencyKey(c) !== currencyKey(from));

  const fromCode = (from?.code ?? "").toUpperCase();
  const toCode = (to?.code ?? "").toUpperCase();

  const senderWallet = ownWallet(from);
  /**
   * The receiving side's wallet, and it is required.
   *
   * `store` takes a WALLET id on both sides. The field is named
   * `receiver_currency`, which reads like `currencies[].id` and is not: posting a
   * currency id there is rejected. Both ids come from the same place —
   * `currencies[].wallets[].id` — which is also why a coin with no wallet behind it
   * cannot be either side of a swap, not just the sending one.
   */
  const receiverWallet = ownWallet(to);
  const senderRate = num(from?.rate);
  const balance = walletBalance(from);
  const sending = toNumber(amountRaw);

  const figures = exchangeQuote({ sending, senderRate, receiverRate: num(to?.rate), fees });
  const limits = exchangeLimits(fees, senderRate);
  /** What the balance can cover once the fee is added on top of the amount. */
  const sendable = maxSendable({ balance, senderRate, fees });

  /**
   * The first thing standing between this form and a swap, or null.
   *
   * Pair problems show immediately — they are the state of the account, not
   * something the user typed. Amount problems wait for a blur, so the field does
   * not go red on the first keystroke.
   */
  const problem = (() => {
    if (!from || !to) return null;
    if (!senderWallet) return k("errorNoWallet").replace("{coin}", fromCode);
    // Same message for the receiving side: from the user's point of view it is the
    // same fact — that coin has no wallet on this account for the swap to use.
    if (!receiverWallet) return k("errorNoWallet").replace("{coin}", toCode);
    if (currencyKey(from) === currencyKey(to)) return k("errorSamePair");
    if (!touched) return null;
    if (sending <= 0) return k("errorAmount");
    if (limits.min > 0 && sending < limits.min)
      return k("errorMin").replace("{min}", coinAmount(limits.min)).replace("{coin}", fromCode);
    if (limits.max > 0 && sending > limits.max)
      return k("errorMax").replace("{max}", coinAmount(limits.max)).replace("{coin}", fromCode);
    if (figures.payable > balance)
      return k("errorBalance")
        .replace("{payable}", coinAmount(figures.payable))
        .replace("{balance}", coinAmount(balance))
        .replace("{coin}", fromCode);
    return null;
  })();

  function pick(side: "from" | "to", next: string) {
    setPair((current) => {
      if (!current) return current;
      // Picking the coin already on the other side flips the pair rather than
      // blocking the choice — the user asked for that coin, and there is only one
      // sensible place to put the one it displaced.
      const other = side === "from" ? current.to : current.from;
      const swapped = next === other;
      if (side === "from") return { from: next, to: swapped ? current.from : current.to };
      return { from: swapped ? current.to : current.from, to: next };
    });
  }

  function swapPair() {
    setPair((current) => (current ? { from: current.to, to: current.from } : current));
    // The amount was denominated in the coin that is now on the receiving side,
    // so carrying it across would silently mean something else.
    setAmountRaw("");
    setTouched(false);
  }

  function setPercent(pct: number) {
    // Divided out of the SENDABLE figure, not the balance: the fee is charged on
    // top, so a Max taken from the balance itself could only ever be rejected.
    setAmountRaw(crypto(floor8((sendable * pct) / 100)));
    setTouched(true);
  }

  function submit() {
    setTouched(true);
    if (!senderWallet?.id || !receiverWallet?.id) return;
    if (sending <= 0 || figures.payable > balance) return;
    if (limits.min > 0 && sending < limits.min) return;
    if (limits.max > 0 && sending > limits.max) return;
    if (currencyKey(from) === currencyKey(to)) return;

    // Two wallet ids, never a currency id — see `receiverWallet` above.
    store.mutate(
      {
        send_amount: sending,
        sender_wallet: senderWallet.id,
        receiver_currency: receiverWallet.id,
      },
      { onSuccess: setDraft },
    );
  }

  function confirmSwap() {
    if (!draft?.identifier) return;
    confirm.mutate(draft.identifier, {
      onSuccess: () => {
        setDraft(null);
        setAmountRaw("");
        setTouched(false);
      },
    });
  }

  const header = (
    <DashPageHeader
      title={k("title")}
      subtitle={k("subtitle")}
      action={
        from && to && figures.rate > 0 ? (
          <LiveRatePill label={k("liveRate")}>
            1 {fromCode} = {coinAmount(figures.rate)} {toCode}
          </LiveRatePill>
        ) : undefined
      }
    />
  );

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        {header}
        <ExchangeSkeleton header={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        {header}
        <Panel className="mx-auto mt-6 max-w-[560px] p-6 text-center">
          <span
            aria-hidden
            className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-hero-neg/10 text-hero-neg"
          >
            <TriangleAlert size={20} />
          </span>
          <h2 className="mt-4 text-[16px]! font-bold!">{k("loadFailed")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {getApiErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-lift mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white"
          >
            <RotateCcw size={15} aria-hidden />
            {k("retry")}
          </button>
        </Panel>
      </div>
    );
  }

  if (!from || !to) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        {header}
        <Panel className="mx-auto mt-6 max-w-[560px] p-6 text-center">
          <span
            aria-hidden
            className="mx-auto grid! h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"
          >
            <Wallet size={20} />
          </span>
          <h2 className="mt-4 text-[16px]! font-bold!">{k("noWallets")}</h2>
          <p className="mx-auto mt-1.5 max-w-100 text-[13px]! leading-relaxed! text-muted">
            {k("noWalletsDesc")}
          </p>
        </Panel>
      </div>
    );
  }

  // The review step takes the whole page rather than sitting beside a form that
  // is no longer what will run.
  if (draft) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        {header}
        <div className="mx-auto mt-6 w-full max-w-[560px]">
          <Panel className="p-4 sm:p-6">
            <ConfirmStep
              draft={draft}
              paths={paths}
              busy={confirm.isPending}
              onBack={() => setDraft(null)}
              onConfirm={confirmSwap}
            />
          </Panel>
        </div>
      </div>
    );
  }

  const option = (currency: ExchangeCurrency, sending?: boolean): SelectOption => {
    // A swap posts a wallet id for BOTH sides, so a coin with no wallet is not
    // selectable on either — offering it on the receiving side only let the user
    // build an order the server was always going to refuse.
    const held = Boolean(ownWallet(currency));

    return {
      value: currencyKey(currency),
      label: (currency.code ?? "").toUpperCase(),
      hint: currency.name,
      // On the sending side the balance is the deciding fact. On the receiving side
      // the balance is not what the user is choosing on, so it stays out of the
      // way — but "no wallet" is still worth saying, since it is why the row is
      // greyed out.
      meta: held ? (sending ? coinAmount(walletBalance(currency)) : undefined) : k("noWallet"),
      icon: <CoinArt currency={currency} paths={paths} size={30} />,
      keywords: currency.name,
      disabled: !held,
    };
  };

  const busy = store.isPending;

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      {header}

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Form ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <div className="relative">
            <AmountField
              label={k("from")}
              value={amountRaw}
              onChange={setAmountRaw}
              onBlur={() => setTouched(true)}
              error={Boolean(problem)}
              disabled={busy}
              selector={
                <SelectMenu
                  label={k("selectFrom")}
                  value={currencyKey(from)}
                  options={currencies.map((c) => option(c, true))}
                  onChange={(next) => pick("from", next)}
                  showHintInTrigger={false}
                  showMetaInTrigger={false}
                  disabled={busy}
                  className="w-38 shrink-0"
                />
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px]! text-muted">
                    {k("balance")}:{" "}
                    <span className="font-semibold tabular-nums text-heading">
                      {coinAmount(balance)} {fromCode}
                    </span>
                  </span>
                  <PercentChips percents={PERCENTS} maxLabel={k("max")} onPick={setPercent} />
                </div>
              }
            />

            {/* The swap control, straddling the seam. On Buy and Sell this spot
                holds a static arrow; here the pair is reversible, so it is the
                page's one signature action and gets to be a real button. */}
            <div className="relative z-[1] flex h-0 items-center justify-center">
              <button
                type="button"
                onClick={swapPair}
                disabled={busy}
                aria-label={k("swap")}
                title={k("swap")}
                className="grid! h-10 w-10 cursor-pointer place-items-center rounded-full border-4 border-card bg-primary text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.35)] transition hover:rotate-180 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowUpDown size={16} aria-hidden />
              </button>
            </div>

            <AmountField
              className="mt-2"
              label={k("to")}
              value={figures.receive > 0 ? coinAmount(figures.receive) : ""}
              readOnly
              selector={
                <SelectMenu
                  label={k("selectTo")}
                  value={currencyKey(to)}
                  options={currencies.map((c) => option(c))}
                  onChange={(next) => pick("to", next)}
                  showHintInTrigger={false}
                  showMetaInTrigger={false}
                  disabled={busy}
                  className="w-38 shrink-0"
                />
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12px]! text-muted">
                  <span>
                    {k("limit")}:{" "}
                    <span className="tabular-nums">
                      {coinAmount(limits.min)} – {coinAmount(limits.max)} {fromCode}
                    </span>
                  </span>
                  <span>
                    {k("networkFees")}:{" "}
                    <span className="tabular-nums">
                      {coinAmount(figures.totalCharge)} {fromCode}
                    </span>
                  </span>
                </div>
              }
            />
          </div>

          {problem && (
            <p className="mt-3 flex items-start gap-1.5 text-[12.5px]! leading-snug! text-hero-neg">
              <TriangleAlert size={13} aria-hidden className="mt-0.5 shrink-0" />
              {problem}
            </p>
          )}
        </Panel>

        {/* ------------------------- Summary ------------------------- */}
        <div className="lg:sticky lg:top-6 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <h2 className="text-[16px]! font-bold!">{k("summary")}</h2>

            {/* The pair, read left to right, so the whole order is one glance. */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <CoinArt currency={from} paths={paths} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px]! font-bold!">{fromCode}</div>
                <div className="truncate text-[11.5px]! text-muted">{from.name}</div>
              </div>
              <ArrowRight size={15} aria-hidden className="shrink-0 text-muted rtl:rotate-180" />
              <div className="min-w-0 flex-1 text-end">
                <div className="truncate text-[13px]! font-bold!">{toCode}</div>
                <div className="truncate text-[11.5px]! text-muted">{to.name}</div>
              </div>
              <CoinArt currency={to} paths={paths} size={34} />
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={k("rate")}>
                1 {fromCode} = {coinAmount(figures.rate)} {toCode}
              </Row>
              <Row label={k("youSend")}>
                {coinAmount(sending)} {fromCode}
              </Row>
              <Row label={k("networkFees")}>
                {coinAmount(figures.totalCharge)} {fromCode}
              </Row>
              <Row label={k("youReceive")}>
                {coinAmount(figures.receive)} {toCode}
              </Row>
              <Row label={k("arrival")}>
                <span className="inline-flex! items-center gap-1.5">
                  <Clock size={13} aria-hidden className="text-muted" />
                  {k("instant")}
                </span>
              </Row>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="text-[13.5px]! font-semibold!">{k("totalDeducted")}</span>
              <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                {coinAmount(figures.payable)} {fromCode}
              </span>
            </div>

            <button
              type="button"
              onClick={submit}
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
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Step two                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The server's quote, and the button that executes it.
 *
 * Every figure here comes from `store`'s response — none is recomputed locally.
 * If the backend priced the order differently from the preview (a rate that moved
 * between typing and submitting), this is where the real number appears, before
 * the user agrees to it.
 */
function ConfirmStep({
  draft,
  paths,
  busy,
  onBack,
  onConfirm,
}: {
  draft: ExchangeDraft;
  paths: ImagePaths | undefined;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`exchangeCrypto.${name}`);

  const quote = draft.data;
  const fromCode = (quote?.sender_wallet?.code ?? "").toUpperCase();
  const toCode = (quote?.receiver_wallet?.code ?? "").toUpperCase();
  const fromBrand = coinBrand(fromCode);
  const toBrand = coinBrand(toCode);

  return (
    <div>
      <h2 className="text-[16px]! font-bold!">{k("confirmTitle")}</h2>
      <p className="mt-1 text-[12.5px]! leading-relaxed! text-muted">{k("confirmNote")}</p>

      {/* The whole order in one line: what leaves, what arrives. The quote does
          not carry the coin art paths, so this side falls back to the marks. */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
        <CoinBadge color={fromBrand.color} glyph={fromBrand.glyph} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px]! font-bold! tabular-nums">
            {coinAmount(quote?.sending_amount)} {fromCode}
          </div>
          <div className="truncate text-[11.5px]! text-muted">
            {quote?.sender_wallet?.name || fromCode}
          </div>
        </div>

        <ArrowRight size={16} aria-hidden className="shrink-0 text-muted rtl:rotate-180" />

        <div className="min-w-0 flex-1 text-end">
          <div className="truncate text-[14px]! font-bold! tabular-nums">
            {coinAmount(quote?.get_amount)} {toCode}
          </div>
          <div className="truncate text-[11.5px]! text-muted">
            {quote?.receiver_wallet?.name || toCode}
          </div>
        </div>
        <CoinBadge color={toBrand.color} glyph={toBrand.glyph} size={34} />
      </div>

      <dl className="mt-4 flex flex-col gap-3">
        <Row label={k("rate")}>
          1 {fromCode} = {coinAmount(quote?.exchange_rate)} {toCode}
        </Row>
        <Row label={k("youSend")}>
          {coinAmount(quote?.sending_amount)} {fromCode}
        </Row>
        <Row label={k("networkFees")}>
          {coinAmount(quote?.total_charge)} {fromCode}
        </Row>
        <Row label={k("youReceive")}>
          {coinAmount(quote?.get_amount)} {toCode}
        </Row>
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="text-[13.5px]! font-semibold!">{k("totalDeducted")}</span>
        <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
          {coinAmount(quote?.payable_amount)} {fromCode}
        </span>
      </div>

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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Coin art                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The API's coin image, with the brand disc behind it as the fallback — the same
 * pairing the wallet cards use. A plain `<img>`, not `next/image`: images are
 * unoptimized in this static export anyway, and the host comes from an env var.
 */
function CoinArt({
  currency,
  paths,
  size = 30,
}: {
  currency: ExchangeCurrency | undefined;
  paths: ImagePaths | undefined;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const code = (currency?.code ?? "").toUpperCase();
  const brand = coinBrand(code);
  const flag = imageUrl(paths, currency?.flag);

  if (!flag || broken) return <CoinBadge color={brand.color} glyph={brand.glyph} size={size} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flag}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  );
}
