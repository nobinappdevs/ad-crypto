/**
 * Journal posts in display order, shared by the list and the details page.
 *
 * `wide` entries span two columns of the list's four-column grid and switch to a
 * side-by-side layout, which is what produces the alternating wide/narrow rhythm
 * rather than a uniform grid.
 *
 * Every post currently shares one placeholder image. `image` is per-post, so
 * swapping in real artwork is a matter of pointing each entry at its own file.
 * `cover` stays as the gradient fallback for any post left without an `image`.
 */
const PLACEHOLDER_COVER = "/assets/journal/blog.webp";

export type JournalPost = {
  key: string;
  wide?: boolean;
  cover: string;
  image?: string;
};

export const JOURNAL_POSTS: JournalPost[] = [
  {
    key: "custody",
    image: PLACEHOLDER_COVER,
    wide: true,
    cover:
      "linear-gradient(135deg, rgb(var(--primary__color)) 0%, #0163a0 45%, #012b44 100%)",
  },
  {
    key: "fees",
    image: PLACEHOLDER_COVER,
    cover: "linear-gradient(150deg, #34a9fd 0%, rgb(var(--primary__color)) 70%, #013d5f 100%)",
  },
  {
    key: "kycFlow",
    image: PLACEHOLDER_COVER,
    cover: "linear-gradient(160deg, #012b44 0%, rgb(var(--primary__color)) 55%, #67bffe 100%)",
  },
  {
    key: "networks",
    image: PLACEHOLDER_COVER,
    cover: "linear-gradient(145deg, #013d5f 0%, rgb(var(--primary__color)) 60%, #9ad4fe 100%)",
  },
  {
    key: "security",
    image: PLACEHOLDER_COVER,
    cover: "linear-gradient(155deg, #67bffe 0%, rgb(var(--primary__color)) 50%, #0163a0 100%)",
  },
  {
    key: "roadmap",
    image: PLACEHOLDER_COVER,
    wide: true,
    cover: "linear-gradient(120deg, #012b44 0%, rgb(var(--primary__color)) 55%, #34a9fd 100%)",
  },
];

/** The details route is a single static page that reads the post from `?id=`. */
export const JOURNAL_DETAILS_PATH = "/web-journal/details";

export function journalHref(key: string) {
  return `${JOURNAL_DETAILS_PATH}?id=${encodeURIComponent(key)}`;
}

export function findJournalPost(key: string | null) {
  if (!key) return undefined;
  return JOURNAL_POSTS.find((post) => post.key === key);
}
