import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { Panel } from "@/components/dashboard/ui";

/**
 * Loading placeholders for every dashboard page.
 *
 * Each one traces the layout of the page it stands in for — same container width,
 * same grid split, same panels in the same order — so the real content lands on the
 * shape the skeleton already drew instead of pushing it around. A centred spinner
 * cannot do that: it says "something is coming" without saying where.
 *
 * These are plain markup with no hooks, so they work both inside a client page's
 * pending branch and as a route-level `loading.tsx` on the server.
 *
 * Every skeleton takes `header`. Left at its default it renders the whole page,
 * breadcrumb block included — that is the route-transition case, where nothing on
 * screen is real yet. A page that already knows its own title passes `header={false}`
 * and gets just the body, so the heading never blinks out and back.
 */

/* -------------------------------------------------------------------------- */
/* Primitives                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One pulsing bar. `soft` is the quieter tone, for text that sits in muted.
 *
 * The `rounded-md` default is dropped the moment the caller names a radius of its
 * own — `cn` here is a plain join, not tailwind-merge, so two radius classes on one
 * element would be settled by stylesheet order rather than by intent.
 */
export function Sk({
  className,
  soft,
  style,
}: {
  className?: string;
  soft?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "block animate-pulse",
        !className?.includes("rounded") && "rounded-md",
        soft ? "bg-black/5 dark:bg-white/6" : "bg-black/8 dark:bg-white/10",
        className,
      )}
    />
  );
}

/**
 * The page container — `wide` is the overview's 1500px, everything else is 1280px.
 *
 * `header` off means the page around it is already real, so the frame contributes
 * neither the container nor the heading. `title` off keeps the container but skips
 * the heading, which is what the overview needs: it has no `DashPageHeader`.
 */
function Frame({
  header = true,
  title = true,
  wide,
  action = true,
  children,
}: {
  header?: boolean;
  title?: boolean;
  wide?: boolean;
  action?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={
        header
          ? cn("mx-auto w-full p-4 sm:p-6", wide ? "max-w-[1500px]" : "max-w-[1280px]")
          : undefined
      }
    >
      {header && title && <SkPageHeader action={action} />}
      {children}
    </div>
  );
}

/** Mirrors `DashPageHeader`: breadcrumb, title, subtitle, and the boxed status chip. */
export function SkPageHeader({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Sk className="h-3 w-16" soft />
          <Sk className="h-3 w-3 rounded-full" soft />
          <Sk className="h-3 w-20" soft />
        </div>
        <Sk className="mt-2.5 h-6 w-52 sm:h-7 sm:w-64" />
        <Sk className="mt-2.5 h-3.5 w-full max-w-100" soft />
      </div>

      {action && (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <Sk className="h-7 w-7 rounded-lg" />
          <span className="flex flex-col gap-1.5">
            <Sk className="h-2.5 w-14" soft />
            <Sk className="h-3 w-24" />
          </span>
        </div>
      )}
    </div>
  );
}

/** Mirrors `PanelTitle` — same padding, so the rule below it lands where it will. */
function SkPanelTitle({ action }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
      <span className="flex items-baseline gap-2">
        <Sk className="h-4 w-40" />
        <Sk className="h-3 w-20" soft />
      </span>
      {action && <Sk className="h-9 w-24 rounded-lg" soft />}
    </div>
  );
}

/** The icon + title + hint block that opens most panels on the inner pages. */
function SkPanelHeading({ lines = 1 }: { lines?: number }) {
  return (
    <div className="flex items-start gap-3">
      <Sk className="h-9 w-9 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Sk className="h-4 w-44" />
        <Sk className="mt-2 h-3 w-full max-w-72" soft />
        {lines > 1 && <Sk className="mt-1.5 h-3 w-full max-w-56" soft />}
      </div>
    </div>
  );
}

/** A labelled `h-13` input, the shape every form field on these pages takes. */
function SkField({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Sk className="h-3 w-24" soft />
      <Sk className="mt-2 h-13 w-full rounded-xl" soft />
    </div>
  );
}

/** One `Row` of an order summary: label on the start edge, figure on the end. */
function SkRow({ width = "w-24" }: { width?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Sk className="h-3 w-20" soft />
      <Sk className={cn("h-3", width)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Composite pieces                                                            */
/* -------------------------------------------------------------------------- */

/** Bar heights that read as data rather than a pattern — twelve months of it. */
const BARS = [46, 72, 38, 84, 58, 66, 42, 78, 52, 62, 36, 70];

/** The bar chart's plot area, legend and month axis included. */
function SkChart({ series = 3 }: { series?: number }) {
  return (
    <div className="px-4 pt-1 pb-5 sm:px-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {Array.from({ length: series }, (_, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Sk className="h-2 w-2 rounded-full" />
              <Sk className="h-2.5 w-14" soft />
            </span>
          ))}
        </div>
        <Sk className="h-7 w-16 rounded-lg" soft />
      </div>

      <div className="flex gap-3">
        {/* Y axis */}
        <div className="flex h-56 flex-col justify-between pb-6 sm:h-60">
          {Array.from({ length: 5 }, (_, i) => (
            <Sk key={i} className="h-2 w-6" soft />
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex h-56 items-end sm:h-60">
            {BARS.map((height, i) => (
              <div
                key={i}
                className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
              >
                {Array.from({ length: series }, (_, s) => (
                  <Sk
                    key={s}
                    className={cn("rounded-t-sm", series === 1 ? "w-4 sm:w-6" : "w-1.5 sm:w-2")}
                    soft={s % 2 === 1}
                    // Each series sits a step below the one before it, the way a
                    // grouped column actually steps down.
                    style={{ height: `${Math.max(12, height - s * 12)}%` }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* X axis labels */}
          <div className="mt-2 flex">
            {BARS.map((_, i) => (
              <span key={i} className="flex min-w-0 flex-1 justify-center">
                <Sk className="h-2 w-5" soft />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A ledger table. `wide` is the full transactions page — a selection column and
 * more figures per row than the overview's panel carries.
 */
function SkTable({ rows = 6, wide = false }: { rows?: number; wide?: boolean }) {
  const numbers = wide ? 4 : 3;

  return (
    <div className="overflow-x-auto">
      <div className={wide ? "min-w-290" : "min-w-230"}>
        {/* Head */}
        <div className="flex items-center gap-4 border-b border-border px-5 py-3.5">
          {wide && <Sk className="h-4.5 w-4.5 shrink-0 rounded-[5px]" soft />}
          <Sk className="h-2.5 w-16 shrink-0" soft />
          <div className="w-36 shrink-0">
            <Sk className="h-2.5 w-14" soft />
          </div>
          {Array.from({ length: numbers }, (_, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-end">
              <Sk className="h-2.5 w-14" soft />
            </div>
          ))}
          <div className="w-32 shrink-0">
            <Sk className="h-2.5 w-12" soft />
          </div>
          <div className="w-28 shrink-0">
            <Sk className="h-2.5 w-14" soft />
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
          >
            {wide && <Sk className="h-4.5 w-4.5 shrink-0 rounded-[5px]" soft />}

            <span className="flex shrink-0 items-center gap-2.5">
              <Sk className="h-8 w-8 shrink-0 rounded-lg" />
              <Sk className="h-3 w-16" />
            </span>

            <span className="flex w-36 shrink-0 items-center gap-2.5">
              <Sk className="h-7 w-7 shrink-0 rounded-full" />
              <span className="flex min-w-0 flex-col gap-1.5">
                <Sk className="h-3 w-10" />
                <Sk className="h-2.5 w-16" soft />
              </span>
            </span>

            {Array.from({ length: numbers }, (_, i) => (
              <div key={i} className="flex min-w-0 flex-1 justify-end">
                <Sk className={i === 0 ? "h-3 w-16" : "h-3 w-12"} soft={i > 0} />
              </div>
            ))}

            <span className="flex w-32 shrink-0 flex-col gap-1.5">
              <Sk className="h-3 w-20" />
              <Sk className="h-2.5 w-24" soft />
            </span>

            <span className="flex w-28 shrink-0 items-center gap-1.5">
              <Sk className="h-1.5 w-1.5 rounded-full" />
              <Sk className="h-3 w-16" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

/** One wallet card: coin name, art, balance, and the deposit address footer. */
function SkWalletCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-2 px-4.5 pt-4">
        <Sk className="h-3 w-20" soft />
        <Sk className="h-8.5 w-8.5 shrink-0 rounded-full" />
      </div>

      <div className="px-4.5 pt-4 pb-4">
        <Sk className="h-6.5 w-36" />
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border px-4.5 py-3">
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Sk className="h-2.5 w-24" soft />
          <Sk className="h-3 w-full max-w-44" />
        </span>
        <Sk className="h-8 w-8 shrink-0 rounded-lg" soft />
      </div>
    </div>
  );
}

/** `/dashboard` — wallet cards, the two activity charts, then recent transactions. */
export function DashboardHomeSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header} title={false} wide>
      {/* The overview opens straight on the wallet heading — no breadcrumb block. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Sk className="h-5 w-36" />
        <Sk className="h-9 w-28 rounded-full" soft />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkWalletCard key={i} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <SkPanelTitle />
          <SkChart />
        </Panel>
        <Panel className="lg:col-span-2">
          <SkPanelTitle />
          <SkChart series={1} />
        </Panel>
      </div>

      <Panel className="mt-5">
        <SkPanelTitle action />
        <SkTable rows={5} />
      </Panel>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

/** `/dashboard/transactions` — filter chips, search, and the full ledger. */
export function TransactionsSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header} wide>
      <Panel className="mt-6">
        <SkPanelTitle action />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border px-4 pb-4 sm:px-5">
          <div className="flex flex-wrap gap-1.5">
            {[56, 44, 44, 72, 60, 64].map((width, i) => (
              <Sk key={i} className="h-8 rounded-lg" soft={i > 0} style={{ width }} />
            ))}
          </div>
          <Sk className="ms-auto h-9 w-full max-w-64 rounded-lg" soft />
        </div>

        <SkTable rows={8} wide />
      </Panel>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* Trade pages — buy / sell / exchange / withdraw                              */
/* -------------------------------------------------------------------------- */

/** The big amount box, with its label, figure, selector and footer line. */
function SkAmountField({ className, selector }: { className?: string; selector?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-3.5", className)}>
      <Sk className="h-3 w-20" soft />
      <div className="mt-2 flex items-center gap-3">
        <Sk className="h-7 min-w-0 flex-1 max-w-44" />
        {selector && <Sk className="h-11 w-38 shrink-0 rounded-xl" soft />}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <Sk className="h-2.5 w-32" soft />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Sk key={i} className="h-6 w-10 rounded-lg" soft />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * The four trade pages share one layout — a 7/5 split of form and order summary —
 * so they share one skeleton.
 */
export function TradeSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Form ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          {/* Segmented control */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface p-1.5">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5">
                <Sk className="h-3.5 w-28" soft={i > 0} />
                <Sk className="h-2.5 w-20" soft />
              </div>
            ))}
          </div>

          {/* Four labelled fields, two per row: coin, network, amount, method */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="min-w-0">
                <Sk className="h-3 w-24" soft />
                <Sk className="mt-2 h-13 w-full rounded-xl" soft />
              </div>
            ))}
          </div>

          {/* The button belongs to the form on these two pages. */}
          <Sk className="mt-5 h-12 w-full rounded-xl" />
          <Sk className="mt-3 h-2.5 w-full max-w-60" soft />
        </Panel>

        {/* ---- Summary ---- */}
        <div className="lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <Sk className="h-4 w-28" />

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <Sk className="h-9.5 w-9.5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Sk className="h-3.5 w-28" />
                <Sk className="mt-1.5 h-2.5 w-20" soft />
              </div>
              <Sk className="h-6 w-20 shrink-0 rounded-lg" soft />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <SkRow width="w-28" />
              <SkRow />
              <SkRow width="w-20" />
              <SkRow width="w-24" />
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <Sk className="h-3.5 w-24" />
              <Sk className="h-5 w-32" />
            </div>
          </Panel>
        </div>
      </div>
    </Frame>
  );
}

/**
 * `/dashboard/exchange-crypto` — the trade layout without the parts a swap has
 * no use for.
 *
 * Same 7/5 split as `TradeSkeleton`, minus the source toggle, the network field
 * and the method cards: a swap is two coins and one amount, so the form is the
 * pair and nothing else.
 */
export function ExchangeSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Form ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <div className="relative">
            <SkAmountField selector />
            <div className="relative z-[1] flex h-0 items-center justify-center">
              <Sk className="h-10 w-10 rounded-full border-4 border-card" />
            </div>
            <SkAmountField className="mt-2" selector />
          </div>
        </Panel>

        {/* ---- Summary ---- */}
        <div className="lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <Sk className="h-4 w-28" />

            {/* The pair card: a coin at each end of the row. */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <Sk className="h-8.5 w-8.5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Sk className="h-3 w-12" />
                <Sk className="mt-1.5 h-2.5 w-20" soft />
              </div>
              <Sk className="h-3.5 w-3.5 shrink-0 rounded-full" soft />
              <div className="flex min-w-0 flex-1 flex-col items-end">
                <Sk className="h-3 w-12" />
                <Sk className="mt-1.5 h-2.5 w-20" soft />
              </div>
              <Sk className="h-8.5 w-8.5 shrink-0 rounded-full" />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <SkRow width="w-28" />
              <SkRow />
              <SkRow width="w-20" />
              <SkRow width="w-24" />
              <SkRow width="w-16" />
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <Sk className="h-3.5 w-28" />
              <Sk className="h-5 w-32" />
            </div>

            <Sk className="mt-5 h-12 w-full rounded-xl" />
            <Sk className="mt-3 h-2.5 w-full max-w-60" soft />
          </Panel>
        </div>
      </div>
    </Frame>
  );
}

/**
 * `/dashboard/withdraw-crypto` — the pair, the address field, and the summary.
 *
 * Same 7/5 split as `TradeSkeleton` with the source toggle and method cards
 * dropped: a withdrawal is an amount, a coin and an address.
 */
export function WithdrawSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Form ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <div className="relative">
            <SkAmountField selector />
            <div className="relative z-[1] flex h-0 items-center justify-center">
              <Sk className="h-9 w-9 rounded-full border-4 border-card" />
            </div>
            <SkAmountField className="mt-2" />
          </div>

          {/* Address, then the warning that always sits under it */}
          <div className="mt-6">
            <Sk className="mb-2 h-3 w-28" />
            <Sk className="h-13 w-full rounded-xl" soft />
            <Sk className="mt-2.5 h-14 w-full rounded-xl" soft />
          </div>
        </Panel>

        {/* ---- Summary ---- */}
        <div className="lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <Sk className="h-4 w-36" />

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <Sk className="h-9.5 w-9.5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Sk className="h-3.5 w-28" />
                <Sk className="mt-1.5 h-2.5 w-20" soft />
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border bg-surface p-3">
              <Sk className="h-2.5 w-24" soft />
              <Sk className="mt-2 h-3 w-full max-w-56" />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <SkRow width="w-24" />
              <SkRow width="w-20" />
              <SkRow width="w-28" />
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <Sk className="h-3.5 w-28" />
              <Sk className="h-5 w-32" />
            </div>

            <Sk className="mt-5 h-12 w-full rounded-xl" />
            <Sk className="mt-3 h-2.5 w-full max-w-60" soft />
          </Panel>
        </div>
      </div>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* KYC                                                                         */
/* -------------------------------------------------------------------------- */

/** `/dashboard/kyc` — status card, then the 8/4 split of form and checklist. */
export function KycSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      {/* Status card */}
      <Panel className="mt-6 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Sk className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Sk className="h-4 w-48" />
              <Sk className="h-4.5 w-20 rounded-full" soft />
            </div>
            <Sk className="mt-2.5 h-3 w-full max-w-120" soft />
          </div>
        </div>
      </Panel>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Form ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-8">
          <div className="flex items-start gap-3">
            <Sk className="h-7 w-7 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <Sk className="h-4 w-40" />
              <Sk className="mt-2 h-3 w-full max-w-80" soft />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <SkField key={i} className={i === 5 ? "sm:col-span-2" : undefined} />
            ))}
          </div>

          <div className="my-6 h-px bg-border" />

          <Sk className="h-12 w-full rounded-xl" />
          <Sk className="mt-3 h-2.5 w-full max-w-72" soft />
        </Panel>

        {/* ---- Checklist rail ---- */}
        <div className="lg:col-span-4">
          <Panel className="p-4 sm:p-6">
            <SkPanelHeading />
            <div className="mt-4 flex flex-col gap-2.5">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Sk className="h-4.5 w-4.5 shrink-0 rounded-full" soft />
                  <Sk className="h-3 w-full max-w-36" />
                </div>
              ))}
            </div>
            <Sk className="mt-5 h-14 w-full rounded-xl" soft />
          </Panel>
        </div>
      </div>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* Security (2FA)                                                              */
/* -------------------------------------------------------------------------- */

/** `/dashboard/security` — 7/5 split of the setup panel and the app + steps rail. */
export function SecuritySkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Setup ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <SkPanelHeading />

          {/* Status banner */}
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border px-4 py-3.5">
            <Sk className="h-4 w-4 shrink-0 rounded-full" />
            <Sk className="h-3 w-full max-w-96" soft />
          </div>

          {/* Secret key */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5">
              <Sk className="h-3 w-20" />
              <Sk className="h-2.5 w-40" soft />
            </div>
            <div className="flex h-13 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5">
              <Sk className="h-3.5 w-full max-w-56" soft />
              <Sk className="h-3.5 w-14 shrink-0" soft />
            </div>
          </div>

          {/* QR plate */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5">
              <Sk className="h-3 w-16" />
              <Sk className="h-2.5 w-44" soft />
            </div>
            <div className="flex justify-center rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <div className="grid min-h-56 w-full max-w-56 place-items-center rounded-xl bg-white p-3.5 sm:p-4">
                <Sk className="h-49 w-full max-w-49 rounded-lg" />
              </div>
            </div>
          </div>

          <Sk className="mt-6 h-12 w-full rounded-xl" />
        </Panel>

        {/* ---- App + steps ---- */}
        <div className="grid grid-cols-1 gap-5 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <SkPanelHeading lines={2} />
            <div className="mt-5 flex justify-center">
              <Sk className="h-30 w-30 rounded-2xl" />
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <Sk className="h-12 w-full rounded-xl" />
              <Sk className="h-12 w-full rounded-xl" soft />
            </div>
          </Panel>

          <Panel className="p-4 sm:p-6">
            <Sk className="h-4 w-36" />
            <div className="mt-4 flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Sk className="h-6.5 w-6.5 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Sk className="h-3 w-36" />
                    <Sk className="mt-1.5 h-2.5 w-full max-w-64" soft />
                  </div>
                </div>
              ))}
            </div>
            <Sk className="mt-5 h-12 w-full rounded-xl" soft />
          </Panel>
        </div>
      </div>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* Wallet details                                                              */
/* -------------------------------------------------------------------------- */

/** `/dashboard/wallet` — the receive panel, and the holding + activity rail. */
export function WalletSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Receive ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-7">
          <SkPanelHeading />

          {/* QR plate */}
          <div className="mt-5 flex justify-center rounded-2xl border border-border bg-surface p-4 sm:p-6">
            <div className="grid min-h-56 w-full max-w-56 place-items-center rounded-xl bg-white p-3.5 sm:p-4">
              <Sk className="h-49 w-full max-w-49 rounded-lg" />
            </div>
          </div>

          {/* Address + copy */}
          <div className="mt-5">
            <Sk className="mb-2 h-3 w-32" />
            <div className="flex h-13 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5">
              <Sk className="h-3.5 w-full max-w-72" soft />
              <Sk className="h-3.5 w-12 shrink-0" soft />
            </div>
          </div>

          {/* Available networks */}
          <div className="mt-6">
            <Sk className="mb-2 h-3 w-36" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Sk className="h-3 w-24" />
                    <Sk className="h-2.5 w-32" soft />
                  </div>
                  <Sk className="mt-2 h-2.5 w-full max-w-72" soft />
                </div>
              ))}
            </div>
          </div>

          <Sk className="mt-5 h-10 w-full rounded-xl" soft />
        </Panel>

        {/* ---- Rail ---- */}
        <div className="grid grid-cols-1 gap-5 lg:col-span-5">
          <Panel>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Sk className="h-11 w-11 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Sk className="h-3.5 w-28" />
                  <Sk className="mt-1.5 h-2.5 w-20" soft />
                </div>
              </div>
              <Sk className="mt-4 h-7.5 w-44" />
              <Sk className="mt-2.5 h-3 w-28" soft />
            </div>

            <div className="grid grid-cols-4 border-t border-border">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-1 py-3.5",
                    i > 0 && "border-s border-border",
                  )}
                >
                  <Sk className="h-4 w-4 rounded-md" />
                  <Sk className="h-2.5 w-12" soft />
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4 sm:p-6">
            <Sk className="h-4 w-40" />
            <div className="mt-4 flex flex-col gap-3.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sk className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Sk className="h-3 w-24" />
                    <Sk className="mt-1.5 h-2.5 w-32" soft />
                  </div>
                  <Sk className="h-3 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

/** `/dashboard/profile` — details and password on the left, account facts on the right. */
export function ProfileSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Details + password ---- */}
        <div className="lg:col-span-7">
          <Panel className="p-4 sm:p-6">
            {/* Avatar row */}
            <div className="flex flex-wrap items-center gap-4">
              <Sk className="h-16 w-16 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Sk className="h-4 w-40" />
                <Sk className="mt-2 h-3 w-52" soft />
              </div>
              <Sk className="h-9 w-30 shrink-0 rounded-lg" soft />
            </div>

            <div className="my-6 h-px bg-border" />

            {/* Personal details */}
            <Sk className="mb-4 h-3.5 w-32" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 3 }, (_, i) => (
                <SkField key={i} className={i === 2 ? "sm:col-span-2" : undefined} />
              ))}
            </div>

            <div className="my-6 h-px bg-border" />

            {/* Address */}
            <Sk className="mb-4 h-3.5 w-24" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 5 }, (_, i) => (
                <SkField key={i} className={i === 4 ? "sm:col-span-2" : undefined} />
              ))}
            </div>

            <div className="my-6 h-px bg-border" />
            <Sk className="h-11 w-full rounded-xl sm:w-40" />
          </Panel>
        </div>

        {/* ---- Password + delete ---- */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="p-4 sm:p-6">
            <Sk className="mb-4 h-3.5 w-24" />
            <div className="flex flex-col gap-4">
              <SkField />
              <SkField />
              <SkField />
              <Sk className="h-11 w-full rounded-xl sm:w-44" />
            </div>
          </Panel>

          {/* Delete account */}
          <div className="rounded-2xl border border-hero-neg/25 bg-card p-4 sm:p-6">
            <Sk className="h-3.5 w-32" />
            <Sk className="mt-2.5 h-3 w-full max-w-64" soft />
            <Sk className="mt-4 h-10 w-40 rounded-xl" soft />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/* Card customer                                                               */
/* -------------------------------------------------------------------------- */

/** `/dashboard/my-cards` — the 8/4 application form and its summary rail. */
export function CardCustomerSkeleton({ header = true }: { header?: boolean }) {
  return (
    <Frame header={header}>
      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* ---- Form ---- */}
        <Panel className="p-4 sm:p-6 lg:col-span-8">
          {Array.from({ length: 2 }, (_, section) => (
            <div key={section} className={section > 0 ? "mt-8" : undefined}>
              <div className="flex items-start gap-3">
                <Sk className="h-7 w-7 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Sk className="h-4 w-40" />
                  <Sk className="mt-2 h-3 w-full max-w-72" soft />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <SkField key={i} className={i === 5 ? "sm:col-span-2" : undefined} />
                ))}
              </div>
            </div>
          ))}

          <div className="my-6 h-px bg-border" />

          <Sk className="h-12 w-full rounded-xl" />
          <Sk className="mt-3 h-2.5 w-full max-w-72" soft />
        </Panel>

        {/* ---- Rail ---- */}
        <div className="lg:col-span-4">
          <Panel className="p-4 sm:p-6">
            <SkPanelHeading />
            <div className="mt-4 flex flex-col gap-2.5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Sk className="h-4.5 w-4.5 shrink-0 rounded-full" soft />
                  <Sk className="h-3 w-full max-w-36" />
                </div>
              ))}
            </div>
            <Sk className="mt-5 h-14 w-full rounded-xl" soft />
          </Panel>
        </div>
      </div>
    </Frame>
  );
}
