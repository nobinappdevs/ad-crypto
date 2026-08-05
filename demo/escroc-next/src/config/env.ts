export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",

  /*
   * Pusher Channels (realtime pub/sub) — used for live escrow conversation
   * messages. The `key` is the PUBLIC app key (safe on the client); defaults
   * match the backend's broadcast config and can be overridden via env.
   * NOTE: confirm these + the channel/event names with the backend broadcast.
   */
  pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY ?? "854fe51e7b550bc5daf0",
  pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap2",
};
