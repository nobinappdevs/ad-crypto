/**
 * Presentation rules for the journal, now that the posts themselves come from
 * `GET /website/journal/*`.
 *
 * What is left here is what the API does not send: the gradient behind a cover
 * that has no artwork, the wide/narrow rhythm of the grid, and the route the
 * details page lives at.
 */

/**
 * Cover gradients, cycled by position.
 *
 * They sit UNDER the image rather than instead of it, so a card is never a blank
 * hole while the file loads — and they still carry any post the operator
 * published without artwork.
 */
export const JOURNAL_COVERS = [
  "linear-gradient(135deg, rgb(var(--primary__color)) 0%, #0163a0 45%, #012b44 100%)",
  "linear-gradient(150deg, #34a9fd 0%, rgb(var(--primary__color)) 70%, #013d5f 100%)",
  "linear-gradient(160deg, #012b44 0%, rgb(var(--primary__color)) 55%, #67bffe 100%)",
  "linear-gradient(145deg, #013d5f 0%, rgb(var(--primary__color)) 60%, #9ad4fe 100%)",
  "linear-gradient(155deg, #67bffe 0%, rgb(var(--primary__color)) 50%, #0163a0 100%)",
  "linear-gradient(120deg, #012b44 0%, rgb(var(--primary__color)) 55%, #34a9fd 100%)",
];

export const journalCover = (index: number) =>
  JOURNAL_COVERS[((index % JOURNAL_COVERS.length) + JOURNAL_COVERS.length) % JOURNAL_COVERS.length];

/**
 * Which cards span two of the grid's four columns.
 *
 * Every fifth card, starting with the first — the rhythm the design was drawn
 * with (a wide card, four narrow, a wide card) held over an arbitrary number of
 * posts instead of the six that were hard-coded.
 */
export const isWideCard = (index: number) => index % 5 === 0;

/** The details route is a single static page that reads the article from `?slug=`. */
export const JOURNAL_DETAILS_PATH = "/web-journal/details";

export function journalHref(slug: string | undefined) {
  return `${JOURNAL_DETAILS_PATH}?slug=${encodeURIComponent(slug ?? "")}`;
}

/** A published date in the active language, or "" for anything unparseable. */
export function journalDate(iso: string | undefined, lang: string): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" });
}
