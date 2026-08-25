import { publicApi } from "@/lib/axios";
import type { ImagePaths } from "@/services/dashboard.service";
import type { ContactRequest } from "@/schemas/contact.schema";

/**
 * The public site's endpoints — no token, hence `publicApi`. Four serve the journal
 * and two accept submissions; none of it is invalidated on sign-out.
 */

export interface JournalCategory {
  id?: number;
  slug?: string;
  name?: string;
  /** Only sent by the category endpoints — the list route omits it. */
  blog_count?: number;
}

/** A card's worth of an article, as the list routes return it. */
export interface JournalSummary {
  id?: number;
  slug?: string;
  /** Relative to `image_paths`, e.g. "seeder/blog6.webp". */
  image?: string;
  title?: string;
  category?: JournalCategory;
  created_at?: string;
}

/** The article itself. `description` is HTML written in the operator's editor. */
export interface JournalArticle extends JournalSummary {
  description?: string;
  tags?: string[];
}

export interface JournalListData {
  journals?: JournalSummary[];
  image_paths?: ImagePaths;
}

/**
 * `GET /website/journal/details/{slug}`. The rail beside an article arrives under
 * `category` or `recent_posts` depending on the build, so both are optional.
 */
export interface JournalDetailsData {
  journal?: JournalArticle;
  category?: JournalCategory[];
  recent_posts?: JournalSummary[];
  image_paths?: ImagePaths;
}

export interface JournalCategoryData {
  category?: JournalCategory;
  journals?: JournalSummary[];
  image_paths?: ImagePaths;
}

export interface JournalCategoriesData {
  categories?: JournalCategory[];
}

/**
 * Both submit endpoints take `g-recaptcha-response`, sent empty as the API's own
 * examples do — the backend only enforces it when reCAPTCHA is switched on, and
 * omitting the field is a 422 on some builds. This is the one line to change.
 */
function submission(values: Record<string, string | undefined>) {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) form.append(name, value ?? "");
  form.append("g-recaptcha-response", "");
  return form;
}

export const websiteService = {
  /** GET /website/journal/all — every article, newest first. */
  async journals(): Promise<{ data?: JournalListData }> {
    const res = await publicApi.get("/website/journal/all");
    return res.data;
  },

  /** GET /website/journal/details/{slug} — one article, 404 when the slug is unknown. */
  async journalDetails(slug: string): Promise<{ data?: JournalDetailsData }> {
    const res = await publicApi.get(`/website/journal/details/${encodeURIComponent(slug)}`);
    return res.data;
  },

  /** GET /website/journal/category/{slug} — one category and its articles. */
  async journalsByCategory(slug: string): Promise<{ data?: JournalCategoryData }> {
    const res = await publicApi.get(`/website/journal/category/${encodeURIComponent(slug)}`);
    return res.data;
  },

  /** GET /website/journal/categories — the filter list, with per-category counts. */
  async journalCategories(): Promise<{ data?: JournalCategoriesData }> {
    const res = await publicApi.get("/website/journal/categories");
    return res.data;
  },

  /** POST /website/contact/message/send — the contact form. */
  async sendMessage(values: ContactRequest) {
    const res = await publicApi.post("/website/contact/message/send", submission({ ...values }), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  /** POST /website/subscribe — the newsletter field in the footer. */
  async subscribe(email: string) {
    const res = await publicApi.post("/website/subscribe", submission({ email }), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default websiteService;
