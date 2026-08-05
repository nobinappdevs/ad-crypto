"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

/** GET /user/user-notification — the current user's notifications. */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(),
  });
}
