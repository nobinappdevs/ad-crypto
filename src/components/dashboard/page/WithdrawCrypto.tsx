"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  CircleCheck,
  ClipboardPaste,
  Loader2,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";
import { DashPageHeader } from "@/components/dashboard/PageHeader";
import { SelectMenu, type SelectOption } from "@/components/dashboard/SelectMenu";
import { CoinBadge } from "@/components/dashboard/CoinBadge";
import {
  AmountField,
  FieldLabel,
  LiveRatePill,
  PercentChips,
  Row,
} from "@/components/dashboard/TradeFields";
import { WithdrawSkeleton } from "@/components/dashboard/Skeletons";
import { getApiErrorMessage } from "@/hooks/useAuth";
import {
  useConfirmWithdraw,
  useStoreWithdraw,
  useWalletAddressCheck,
  useWithdrawIndex,
} from "@/hooks/useWithdraw";
import { coinBrand, imageUrl } from "@/config/media";
import { coinAmount, num } from "@/config/txlog";
import { PERCENTS, crypto, floor8, toNumber } from "@/config/market";
import {
  currencyKey,
  defaultSender,
  exchangeFees,
  exchangeLimits,
  exchangeQuote,
  maxSendable,
  ownWallet,
  walletBalance,
} from "@/config/exchange";
import type { ImagePaths } from "@/services/dashboard.service";
import type { ExchangeCurrency } from "@/services/exchange.service";
import type { WithdrawDraft } from "@/services/withdraw.service";

/**
 * Withdraw Crypto — the trade layout, on `GET /user/withdraw-crypto/index`.
 *
 * Same two steps as the exchange: `store` prices the order and drafts it,
 * `confirm` executes it, and the figures on the confirmation are the SERVER's.
 * What is particular to this page is the destination — the API resolves an
 * address to the wallet behind it, so the field is checked as it is typed and
 * the answer decides what actually arrives.
 *
 * The network picker the demo version carried is gone: the endpoint takes an
 * amount, a wallet and an address, and there was never a chain to choose.
 */

/** How long a typed address waits before it becomes a lookup. */
const ADDRESS_DEBOUNCE = 500;

export function WithdrawCrypto() {
  const { t } = useLang();
  const k = (name: string) => t(`withdrawCrypto.${name}`);

  const { data, isPending, isError, error, refetch } = useWithdrawIndex();
  const store = useStoreWithdraw();
  const confirm = useConfirmWithdraw(k("success"));

  const currencies = data?.currencies ?? [];
  const paths = data?.currency_image_paths;
  const fees = exchangeFees(data?.transaction_fees);

  const [coinId, setCoinId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState("");
  const [address, setAddress] = useState("");
  /** The address as last SENT to the lookup — one query per address, not per key. */
  const [checked, setChecked] = useState("");
  const [touched, setTouched] = useState(false);
  /** The server's quote, once there is one. Its presence IS the review step. */
  const [draft, setDraft] = useState<WithdrawDraft | null>(null);

  // The opening coin depends on which wallets have a balance, so it can only be
  // decided once the payload is here. Set during render rather than in an effect:
  // an effect would paint one frame with no coin and the field empty.
  if (currencies.length > 0 && !coinId) {
    setCoinId(currencyKey(defaultSender(currencies) ?? currencies[0]));
  }

  useEffect(() => {
    const id = setTimeout(() => setChecked(address.trim()), ADDRESS_DEBOUNCE);
    return () => clearTimeout(id);
  }, [address]);

  const check = useWalletAddressCheck(checked);

  const coin = currencies.find((c) => currencyKey(c) === coinId) ?? currencies[0];
  const code = (coin?.code ?? "").toUpperCase();

  const senderWallet = ownWallet(coin);
  const senderRate = num(coin?.rate);
  const balance = walletBalance(coin);
  const sending = toNumber(amountRaw);

  /**
   * The destination's coin, once the lookup has answered. Until then the
   * receiving side is priced as the same coin, which is what it will be for any
   * address belonging to this wallet's currency.
   */
  const destination = check.data?.code ? check.data.code.toUpperCase() : code;
  const receiverRate = check.data?.rate != null ? num(check.data.rate) : senderRate;

  const figures = exchangeQuote({ sending, senderRate, receiverRate, fees });
  const limits = exchangeLimits(fees, senderRate);
  /** What the balance can cover once the fee is added on top of the amount. */
  const sendable = maxSendable({ balance, senderRate, fees });

  const addressInvalid = checked.length > 0 && check.isError;

  /**
   * The first thing standing between this form and a withdrawal, or null.
   *
   * The wallet problem shows immediately — it is the state of the account, not
   * something the user typed. The rest waits for a blur, so nothing goes red on
   * the first keystroke.
   */
  const problem = (() => {
    if (!coin) return null;
    if (!senderWallet) return k("errorNoWallet").replace("{coin}", code);
    if (addressInvalid) return getApiErrorMessage(check.error);
    if (!touched) return null;
    if (sending <= 0) return k("errorAmount");
    if (limits.min > 0 && sending < limits.min)
      return k("errorMin").replace("{min}", coinAmount(limits.min)).replace("{coin}", code);
    if (limits.max > 0 && sending > limits.max)
      return k("errorMax").replace("{max}", coinAmount(limits.max)).replace("{coin}", code);
    if (figures.payable > balance)
      return k("errorBalance")
        .replace("{payable}", coinAmount(figures.payable))
        .replace("{balance}", coinAmount(balance))
        .replace("{coin}", code);
    if (!address.trim()) return k("errorAddress");
    return null;
  })();

  function setPercent(pct: number) {
    // Divided out of the SENDABLE figure, not the balance: the fee is charged on
    // top, so a Max taken from the balance itself could only ever be rejected.
    setAmountRaw(crypto(floor8((sendable * pct) / 100)));
    setTouched(true);
  }

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

  function submit() {
    setTouched(true);
    if (!senderWallet?.id || !address.trim() || addressInvalid) return;
    if (sending <= 0 || figures.payable > balance) return;
    if (limits.min > 0 && sending < limits.min) return;
    if (limits.max > 0 && sending > limits.max) return;

    store.mutate(
      { amount: sending, sender_wallet: senderWallet.id, wallet_address: address.trim() },
      { onSuccess: setDraft },
    );
  }

  function confirmWithdraw() {
    if (!draft?.identifier) return;
    confirm.mutate(draft.identifier, {
      onSuccess: () => {
        setDraft(null);
        setAmountRaw("");
        setAddress("");
        setTouched(false);
      },
    });
  }

  const header = (
    <DashPageHeader
      title={k("title")}
      subtitle={k("subtitle")}
      action={
        coin ? (
          <LiveRatePill label={k("balance")}>
            {coinAmount(balance)} {code}
          </LiveRatePill>
        ) : undefined
      }
    />
  );

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
        {header}
        <WithdrawSkeleton header={false} />
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

  if (!coin) {
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
              busy={confirm.isPending}
              onBack={() => setDraft(null)}
              onConfirm={confirmWithdraw}
            />
          </Panel>
        </div>
      </div>
    );
  }

  const coinOption = (currency: ExchangeCurrency): SelectOption => ({
    value: currencyKey(currency),
    label: (currency.code ?? "").toUpperCase(),
    hint: currency.name,
    // Balance, not price: on this page the question is "how much can I move".
    meta: ownWallet(currency) ? coinAmount(walletBalance(currency)) : k("noWallet"),
    icon: <CoinArt currency={currency} paths={paths} size={30} />,
    keywords: currency.name,
    disabled: !ownWallet(currency),
  });

  const busy = store.isPending;

  return (
    <div className="mx-auto w-full max-w-[1280px] p-4 sm:p-6">
      {header}

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ------------------------- Form ------------------------- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          {/* The two sides are the same coin unless the address says otherwise —
              the gap between them is the fee. */}
          <div className="relative">
            <AmountField
              label={k("youSend")}
              value={amountRaw}
              onChange={setAmountRaw}
              onBlur={() => setTouched(true)}
              error={Boolean(problem)}
              disabled={busy}
              selector={
                <SelectMenu
                  label={k("selectCoin")}
                  value={currencyKey(coin)}
                  options={currencies.map(coinOption)}
                  onChange={setCoinId}
                  showHintInTrigger={false}
                  disabled={busy}
                  className="w-38 shrink-0"
                />
              }
              footer={
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px]! text-muted">
                    {k("balance")}:{" "}
                    <span className="font-semibold tabular-nums text-heading">
                      {coinAmount(balance)} {code}
                    </span>
                  </span>
                  <PercentChips percents={PERCENTS} maxLabel={k("max")} onPick={setPercent} />
                </div>
              }
            />

            <div className="relative z-[1] flex h-0 items-center justify-center">
              <span
                aria-hidden
                className="grid! h-9 w-9 place-items-center rounded-full border-4 border-card bg-primary text-white shadow-[0_8px_18px_rgb(var(--primary__color)/0.35)]"
              >
                <ArrowDown size={15} />
              </span>
            </div>

            <AmountField
              className="mt-2"
              label={k("theyReceive")}
              value={figures.receive > 0 ? coinAmount(figures.receive) : ""}
              readOnly
              suffix={destination}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12px]! text-muted">
                  <span>
                    {k("limit")}:{" "}
                    <span className="tabular-nums">
                      {coinAmount(limits.min)} – {coinAmount(limits.max)} {code}
                    </span>
                  </span>
                  <span>
                    {k("networkFee")}:{" "}
                    <span className="tabular-nums">
                      {coinAmount(figures.totalCharge)} {code}
                    </span>
                  </span>
                </div>
              }
            />
          </div>

          {/* ---- Destination address ---- */}
          <div className="mt-6">
            <FieldLabel>{k("walletAddress")}</FieldLabel>
            <div
              className={cn(
                "flex h-13 items-center gap-2 rounded-xl border bg-surface pr-1.5 pl-3 transition focus-within:ring-2",
                addressInvalid
                  ? "border-hero-neg focus-within:ring-hero-neg/25"
                  : "border-border focus-within:border-primary focus-within:ring-primary/20",
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
                aria-invalid={addressInvalid}
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

            {/* The lookup's verdict, under the field that caused it. An address
                that resolves is worth saying out loud — it is the one part of a
                withdrawal the user cannot take back. */}
            {checked.length > 0 && (
              <p
                aria-live="polite"
                className={cn(
                  "mt-2 flex items-center gap-1.5 text-[12px]!",
                  check.isFetching
                    ? "text-muted"
                    : check.isError
                      ? "text-hero-neg"
                      : "text-hero-mint",
                )}
              >
                {check.isFetching ? (
                  <>
                    <Loader2 size={13} aria-hidden className="animate-spin" />
                    {k("addressChecking")}
                  </>
                ) : check.isError ? (
                  <>
                    <TriangleAlert size={13} aria-hidden />
                    {getApiErrorMessage(check.error)}
                  </>
                ) : (
                  <>
                    <CircleCheck size={13} aria-hidden />
                    {k("addressValid").replace("{coin}", destination)}
                  </>
                )}
              </p>
            )}

            <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[12px]! leading-relaxed! text-amber-700 dark:text-amber-300">
              <TriangleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
              {k("addressWarning")}
            </p>
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

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <CoinArt currency={coin} paths={paths} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px]! font-bold! tabular-nums">
                  {coinAmount(sending)} {code}
                </div>
                <div className="truncate text-[12px]! text-muted">{coin.name}</div>
              </div>
            </div>

            {/* The destination, echoed back. A withdrawal is the one order the user
                cannot undo, so the address they typed is repeated where they are
                about to confirm it. */}
            <div className="mt-3 rounded-xl border border-border bg-surface p-3">
              <span className="text-[11.5px]! text-muted">{k("walletAddress")}</span>
              <p
                className={cn(
                  "mt-1 font-mono text-[12px]! leading-relaxed! break-all",
                  address.trim() ? "text-heading" : "text-muted",
                )}
              >
                {address.trim() || k("addressEmpty")}
              </p>
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <Row label={k("amount")}>
                {coinAmount(sending)} {code}
              </Row>
              <Row label={k("networkFee")}>
                {coinAmount(figures.totalCharge)} {code}
              </Row>
              <Row label={k("theyReceive")}>
                {coinAmount(figures.receive)} {destination}
              </Row>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="text-[13.5px]! font-semibold!">{k("totalDeducted")}</span>
              <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
                {coinAmount(figures.payable)} {code}
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
 * Every figure comes from `store`'s response — none is recomputed locally. The
 * destination is repeated here in full: this is the last screen before coins
 * leave, and a truncated address is not something anyone can check.
 */
function ConfirmStep({
  draft,
  busy,
  onBack,
  onConfirm,
}: {
  draft: WithdrawDraft;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLang();
  const k = (name: string) => t(`withdrawCrypto.${name}`);

  const quote = draft.data;
  const code = (quote?.sender_wallet?.code ?? "").toUpperCase();
  const destination = (quote?.receiver_wallet?.code ?? "").toUpperCase() || code;
  const brand = coinBrand(code);

  return (
    <div>
      <h2 className="text-[16px]! font-bold!">{k("confirmTitle")}</h2>
      <p className="mt-1 text-[12.5px]! leading-relaxed! text-muted">{k("confirmNote")}</p>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
        <CoinBadge color={brand.color} glyph={brand.glyph} size={34} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px]! font-bold! tabular-nums">
            {coinAmount(quote?.amount)} {code}
          </div>
          <div className="truncate text-[11.5px]! text-muted">
            {quote?.sender_wallet?.name || code}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-surface p-3.5">
        <span className="text-[11.5px]! text-muted">{k("walletAddress")}</span>
        <p className="mt-1 font-mono text-[12px]! leading-relaxed! break-all">
          {quote?.receiver_wallet?.address || "—"}
        </p>
      </div>

      <dl className="mt-4 flex flex-col gap-3">
        <Row label={k("amount")}>
          {coinAmount(quote?.amount)} {code}
        </Row>
        <Row label={k("networkFee")}>
          {coinAmount(quote?.total_charge)} {code}
        </Row>
        <Row label={k("theyReceive")}>
          {coinAmount(quote?.will_get)} {destination}
        </Row>
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
        <span className="text-[13.5px]! font-semibold!">{k("totalDeducted")}</span>
        <span className="text-[20px]! leading-none! font-bold! tracking-[-0.02em] tabular-nums">
          {coinAmount(quote?.payable_amount)} {code}
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
