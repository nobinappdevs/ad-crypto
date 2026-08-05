"use client";

import { useQuery } from "@tanstack/react-query";
import { siteService } from "@/services/site.service";
import { useLang } from "@/hooks/useLang";

/** GET /global/site-section-data?lang=… — public blog + currency data. */
export function useSiteSectionData() {
  const { lang } = useLang();
  return useQuery({
    queryKey: ["site-section-data", lang],
    queryFn: () => siteService.getSiteSectionData(lang),
    staleTime: 5 * 60 * 1000,
  });
}
