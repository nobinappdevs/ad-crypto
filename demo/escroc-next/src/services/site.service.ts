import { publicApi } from "@/lib/axios";

export interface AnnouncementCategory {
  id: number;
  name: string;
  slug: string;
  has_announcements: number;
}

export interface Announcement {
  id: number;
  category_id: string;
  name: { language: Record<string, { name: string }> };
  slug: string;
  image: string | null;
  tags: string[];
  details: { language: Record<string, { details: string }> };
  created_at: string;
  updated_at: string;
}

export interface SiteCurrency {
  id: number;
  country: string;
  name: string;
  code: string;
  symbol: string;
  type: string;
  flag: string;
  rate: number;
  default: number;
  status: number;
}

export interface SiteSectionData {
  base_url: string;
  default_image: string;
  blog_image_path: string;
  currency_image_path: string;
  announcement_categories: AnnouncementCategory[];
  announcements: Announcement[];
  currencies: SiteCurrency[];
}

export const siteService = {
  /** GET /global/site-section-data — public blog + currency data for the marketing site. */
  async getSiteSectionData(lang: string): Promise<{ data: SiteSectionData }> {
    const res = await publicApi.get(`/global/site-section-data?lang=${encodeURIComponent(lang)}`);
    return res.data;
  },
};

export default siteService;
