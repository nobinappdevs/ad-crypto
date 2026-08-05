"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { profileService } from "@/services/profile.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";
import { TOKEN_KEY } from "@/lib/axios";
import type { UpdateProfileRequest, UpdatePasswordRequest } from "@/schemas/profile.schema";

/** POST /user/profile/update — refreshes the cached profile on success. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, UpdateProfileRequest>({
    mutationFn: (payload) => profileService.update(payload),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Profile updated"));
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET /user/profile/type/update — toggles buyer/seller, refreshes profile. */
export function useUpdateProfileType() {
  const qc = useQueryClient();
  return useMutation<unknown, unknown, void>({
    mutationFn: () => profileService.updateType(),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Account type updated"));
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/profile/password/update — changes the password. */
export function useUpdatePassword() {
  return useMutation<unknown, unknown, UpdatePasswordRequest>({
    mutationFn: (payload) => profileService.updatePassword(payload),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, "Password updated")),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/profile/delete/account — deletes the account, then signs out. */
export function useDeleteAccount() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation<unknown, unknown, void>({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Account deleted"));
      if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
      qc.clear();
      router.replace("/login");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
