import type { Client } from "@pusher/push-notifications-web";

/**
 * Module-level handle to the active Pusher Beams client so places outside the
 * <PushNotifications /> component (e.g. logout) can tear it down. Stopping on
 * logout clears the device's Beams state — otherwise the next account on this
 * browser hits "Changing the `userId` is not allowed."
 */
let activeClient: Client | null = null;

export function setBeamsClient(client: Client | null) {
  activeClient = client;
}

export async function stopBeamsClient() {
  const client = activeClient;
  activeClient = null;
  if (!client) return;
  try {
    await client.stop();
  } catch {
    /* already stopped / never started — ignore */
  }
}
