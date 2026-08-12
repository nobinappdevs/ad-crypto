const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Laravel's broadcast-auth route lives at the app root, not under /api/v1. */
const appRoot = apiUrl.replace(/\/api\/v\d+\/?$/, "");

export const env = {
  apiUrl,

  /*
   * Pusher Channels (realtime pub/sub) — the escrow chat's only transport.
   *
   * These are OVERRIDES, deliberately empty by default: the real values come
   * from the backend at runtime (`pusher_broadcast_config`, see
   * `usePusherBroadcastConfig`). That keeps credentials out of the static
   * bundle and lets the backend rotate them without a rebuild. Set them in
   * `.env` only to test against a different Pusher app locally.
   */
  pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
  pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "",
  /** Channel template — `{escrow_id}` is substituted at subscribe time. */
  pusherConversationChannel: process.env.NEXT_PUBLIC_PUSHER_CONVERSATION_CHANNEL ?? "",
  pusherConversationEvent: process.env.NEXT_PUBLIC_PUSHER_CONVERSATION_EVENT ?? "",

  /**
   * Auth endpoint for `private-*` channels. Pusher calls it with the socket id;
   * we attach the user's bearer token. Ignored by public channels.
   */
  pusherAuthEndpoint:
    process.env.NEXT_PUBLIC_PUSHER_AUTH_ENDPOINT ?? `${appRoot}/broadcasting/auth`,
};
