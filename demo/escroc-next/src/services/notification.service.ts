import { privateApi } from "@/lib/axios";

export interface UserNotification {
  id: number;
  user_id: string;
  type: string; // BALANCE_ADDED | WITHDRAW | MONEY_EXCHANGE | …
  message: { title?: string; message?: string; time?: string };
  seen: string; // "0" unseen | "1" seen
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  /** GET /user/user-notification — the current user's notifications. */
  async getNotifications(): Promise<{ data: { notifications: UserNotification[] } }> {
    const res = await privateApi.get("/user/user-notification");
    return res.data;
  },
};

export default notificationService;
