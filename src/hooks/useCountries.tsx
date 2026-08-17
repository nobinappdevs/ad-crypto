"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { countryService, type Country } from "@/services/country.service";
import { countryFlag } from "@/config/countries";
import type { SelectOption } from "@/components/dashboard/SelectMenu";

export const COUNTRIES_KEY = ["countries"] as const;

/**
 * GET /country-list.
 *
 * The dial codes come from the backend's own table rather than a phone-number
 * package: these are the exact strings `mobile_code` is stored and returned in, so
 * a code picked here round-trips instead of nearly matching. It also costs no
 * dependency, and the list never changes within a session — hence the long
 * `staleTime`.
 */
export function useCountries(enabled = true) {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: () => countryService.list(),
    enabled,
    staleTime: 24 * 60 * 60_000,
    select: (res): Country[] => res?.data?.countries ?? [],
  });
}

/** "+880" and "880" are the same code — compare and key on the bare digits. */
export const dialKey = (code: string | null | undefined) =>
  (code ?? "").trim().replace(/^\+/, "");

/**
 * Dial codes as select options, one row per distinct code.
 *
 * Deduped because +1 is the United States AND Canada AND twenty Caribbean states:
 * listing it twenty-two times would make the picker unusable, and the value would
 * be identical anyway. The first country to claim a code lends it a flag and a
 * label; the rest go into `keywords`, so searching "Canada" still finds +1.
 */
export function useDialCodeOptions(): { options: SelectOption[]; isPending: boolean } {
  const { data, isPending } = useCountries();

  const options = useMemo(() => {
    const byCode = new Map<string, { country: Country; also: string[] }>();

    for (const country of data ?? []) {
      const key = dialKey(country.mobile_code);
      if (!key) continue;

      const entry = byCode.get(key);
      if (entry) entry.also.push(country.name ?? "");
      else byCode.set(key, { country, also: [] });
    }

    return [...byCode.entries()]
      .sort((a, b) => (a[1].country.name ?? "").localeCompare(b[1].country.name ?? ""))
      .map(([key, { country, also }]): SelectOption => {
        const iso = (country.iso2 ?? "").toUpperCase();
        return {
          value: key,
          label: `+${key}`,
          hint: country.name,
          keywords: [iso, ...also].join(" "),
          icon: iso ? (
            <span aria-hidden className="w-6 shrink-0 text-center text-[17px]!">
              {countryFlag(iso)}
            </span>
          ) : undefined,
        };
      });
  }, [data]);

  return { options, isPending };
}
