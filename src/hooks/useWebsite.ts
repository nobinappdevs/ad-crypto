"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  websiteService,
  type JournalCategoriesData,
  type JournalCategoryData,
  type JournalDetailsData,
  type JournalListData,
} from "@/services/website.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import type { ContactRequest } from "@/schemas/contact.schema";

export const WEBSITE_KEY = ["website"] as const;

/**
 * Published content changes on the operator's schedule, not the visitor's, so
 * these are held for five minutes and not refetched when the tab regains focus —
 * an article does not go stale while it is being read.
 */
const CONTENT_STALE_TIME = 5 * 60_000;

/** GET /website/journal/all */
export function useJournals(enabled = true) {
  return useQuery({
    queryKey: [...WEBSITE_KEY, "journals"],
    queryFn: () => websiteService.journals(),
    enabled,
    staleTime: CONTENT_STALE_TIME,
    refetchOnWindowFocus: false,
    select: (res): JournalListData => res?.data ?? {},
  });
}

/** GET /website/journal/categories — the filter list. */
export function useJournalCategories(enabled = true) {
  return useQuery({
    queryKey: [...WEBSITE_KEY, "journal-categories"],
    queryFn: () => websiteService.journalCategories(),
    enabled,
    staleTime: CONTENT_STALE_TIME,
    refetchOnWindowFocus: false,
    select: (res): JournalCategoriesData => res?.data ?? {},
  });
}

/** GET /website/journal/category/{slug} — one category's articles. */
export function useJournalsByCategory(slug: string, enabled = true) {
  return useQuery({
    queryKey: [...WEBSITE_KEY, "journal-category", slug],
    queryFn: () => websiteService.journalsByCategory(slug),
    enabled: enabled && slug.length > 0,
    staleTime: CONTENT_STALE_TIME,
    refetchOnWindowFocus: false,
    select: (res): JournalCategoryData => res?.data ?? {},
  });
}

/**
 * GET /website/journal/details/{slug}.
 *
 * Not retried: an unknown slug answers 404 ("Journal not found!"), which is an
 * ANSWER — the page renders it as a not-found state — and asking twice more
 * only delays that by a few seconds.
 */
export function useJournalDetails(slug: string, enabled = true) {
  return useQuery({
    queryKey: [...WEBSITE_KEY, "journal", slug],
    queryFn: () => websiteService.journalDetails(slug),
    enabled: enabled && slug.length > 0,
    retry: false,
    staleTime: CONTENT_STALE_TIME,
    refetchOnWindowFocus: false,
    select: (res): JournalDetailsData => res?.data ?? {},
  });
}

/** POST /website/contact/message/send */
export function useSendMessage(successMessage: string) {
  return useMutation({
    mutationFn: (values: ContactRequest) => websiteService.sendMessage(values),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, successMessage)),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /website/subscribe.
 *
 * The backend's own wording is preferred on success because it distinguishes a
 * new subscription from an address that was already on the list — a detail this
 * side cannot know and should not invent.
 */
export function useSubscribe(successMessage: string) {
  return useMutation({
    mutationFn: (email: string) => websiteService.subscribe(email),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, successMessage)),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
