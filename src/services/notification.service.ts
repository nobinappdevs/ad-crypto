import { privateApi } from "@/lib/axios";

/**
 * One notification. `message` is a per-event object, not a sentence — the panel
 * composes the line, which is what lets it render in the user's language.
 *
 * Note what is NOT here: any read/unread flag, and no endpoint to set one.
 */
export interface UserNotification {
  id?: number;
  message?: {
    /** "Sell Crypto", "Received Crypto From John Cary" — free text from the server. */
    title?: string;
    /** Coin name and ticker, when the event concerns a wallet. */
    wallet?: string;
    code?: string;
    amount?: number | string;
    status?: number;
    /** The server's own outcome line, e.g. "Successfully Request Send.". */
    success?: string;
  };
  created_at?: string;
}

export const notificationService = {
  /** GET /user/notification — newest activity for the signed-in account. */
  async list(): Promise<{ data?: { notification?: UserNotification[] } }> {
    const res = await privateApi.get("/user/notification");
    return res.data;
  },
};

export default notificationService;
