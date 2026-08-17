"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationService, type UserNotification } from "@/services/notification.service";

export const NOTIFICATIONS_KEY = ["notifications"] as const;

/** GET /user/notification — the bell's feed. */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationService.list(),
    enabled,
    // Stale after a minute: the panel is opened on demand, and an hour-old feed
    // behind a bell icon defeats the point of having one.
    staleTime: 60_000,
    select: (res): UserNotification[] => res?.data?.notification ?? [],
  });
}
