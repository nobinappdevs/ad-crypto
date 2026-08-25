"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  profileService,
  type PasswordUpdateRequest,
  type ProfileData,
  type ProfileUpdateRequest,
} from "@/services/profile.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { imageUrl } from "@/config/media";

export const PROFILE_KEY = ["profile"] as const;

/** GET /user/profile/info — who is signed in. */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => profileService.get(),
    enabled,
    // The signed-in identity does not change under us; a stale name is not a risk
    // the way a stale balance is.
    staleTime: 5 * 60_000,
    select: (res): ProfileData => res?.data ?? {},
  });
}

/**
 * POST /user/profile/info/update. Refetches rather than writing the form's values
 * into the cache — the server decides what stuck, and the response is empty.
 */
export function useUpdateProfile(successMessage: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProfileUpdateRequest) => profileService.update(values),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, successMessage));
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * POST /user/profile/password/update. Nothing is invalidated — the token survives
 * and no cached query holds a password. The caller clears its own fields.
 */
export function useUpdatePassword(successMessage: string) {
  return useMutation({
    mutationFn: (values: PasswordUpdateRequest) => profileService.updatePassword(values),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, successMessage)),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/**
 * Field name -> first complaint, from a validation failure on either endpoint. Same
 * keyed `errors` shape as KYC, so each message can go under its own control.
 */
export function getProfileFieldErrors(err: unknown): Record<string, string> {
  const bag = (err as { response?: { data?: { errors?: Record<string, unknown> } } })?.response?.data
    ?.errors;
  if (!bag || typeof bag !== "object") return {};

  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(bag)) {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (typeof first === "string" && first) out[field] = first;
  }
  return out;
}

/**
 * The header's view of the account: display name, email, initials, avatar URL.
 * Every part degrades on its own — the name falls back through name, username, email.
 */
export function useAccountIdentity() {
  const { data, isPending } = useProfile();
  const user = data?.user_info;

  const full = [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim();
  const email = user?.email ?? "";
  const name = full || user?.username || email.split("@")[0] || "";

  return {
    isPending,
    name,
    email,
    /**
     * The uploaded avatar, or the API's `default_image`; `imageUrl` joins each against
     * the right base. "" only when no paths came at all, and callers draw initials.
     */
    avatar: imageUrl(data?.image_paths, user?.image),
    initials: initialsOf(full, user?.username, email),
    kycVerified: user?.kyc_verified,
  };
}

/** Two letters from the best source available, uppercased. */
function initialsOf(full: string, username?: string, email?: string) {
  const words = full.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const single = words[0] || username || email?.split("@")[0] || "";
  return single.slice(0, 2).toUpperCase();
}
