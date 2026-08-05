/* Pusher Beams web-push service worker. */
importScripts("https://js.pusher.com/beams/service-worker.js");

/*
 * Forward every incoming Beams push to any open app tab so the in-app
 * notification list can refresh in realtime, then let Beams show the OS
 * notification as usual.
 *
 * Debug: these logs appear in the SERVICE WORKER console —
 * DevTools → Application → Service Workers → click "service-worker.js" link.
 */
self.PusherPushNotifications.onNotificationReceived = ({ pushEvent, payload, handleNotification }) => {
  console.log("[Beams SW] push received:", JSON.stringify(payload));
  pushEvent.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        console.log("[Beams SW] forwarding to", clients.length, "open tab(s)");
        clients.forEach((client) => client.postMessage({ type: "PUSHER_BEAMS_NOTIFICATION", payload }));
      }),
  );
  console.log("[Beams SW] showing OS notification");
  handleNotification(payload);
};
