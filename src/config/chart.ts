/**
 * Axis scaling for the dashboard charts.
 *
 * The charts used to hard-code `Y_MAX = 1500` against demo figures in the
 * hundreds. Real data does not cooperate: the dashboard's series are per-month
 * transaction COUNTS, so a busy month is 2 and a fixed 1500 ceiling would draw
 * every bar as an invisible sliver. The ceiling has to come from the data.
 */

const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

export type Scale = { max: number; ticks: number[] };

/**
 * A round ceiling at or above `max`, and the gridline values under it.
 *
 * `integer` forces a whole-number step, which is what counts need — a "2.5
 * transactions" gridline is nonsense. An all-zero series still gets a real axis
 * (0..steps) rather than a degenerate one, because `YAxis` keys its labels by
 * value and repeated zeros would collide.
 */
export function niceScale(max: number, { steps = 5, integer = false } = {}): Scale {
  const peak = Number.isFinite(max) && max > 0 ? max : 0;
  if (peak === 0) {
    return { max: steps, ticks: descending(steps, steps) };
  }

  const rough = peak / steps;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  let step = NICE_STEPS.map((n) => n * magnitude).find((candidate) => candidate >= rough);
  if (!step) step = 10 * magnitude;
  if (integer) step = Math.max(1, Math.ceil(step));

  const top = step * steps;
  return { max: top, ticks: descending(top, steps) };
}

/** `[top, …, 0]`, one entry per gridline, highest first — the order `YAxis` draws. */
function descending(top: number, steps: number) {
  return Array.from({ length: steps + 1 }, (_, i) => round(top - (top / steps) * i));
}

/** Kills float dust: 1500/5*3 lands on 899.9999999999999 otherwise. */
function round(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * The i18n key for one of the API's month labels, or null when it isn't a month
 * we recognise.
 *
 * The backend sends English abbreviations ("Jan".."Dec"). Mapping them back to
 * the dictionary is what keeps the axis readable in Arabic or Hindi; anything
 * unrecognised is shown verbatim rather than guessed at, so a backend that starts
 * sending week numbers or dates still renders something true.
 */
const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export function monthKeyOf(label: string | undefined): string | null {
  const needle = (label ?? "").trim().slice(0, 3).toLowerCase();
  return (MONTH_KEYS as readonly string[]).includes(needle) ? needle : null;
}

/** The 12 fallback labels, for a response that omits `chart.labels`. */
export const FALLBACK_MONTHS = MONTH_KEYS;
