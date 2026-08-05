"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Client } from "@pusher/push-notifications-web";
import { useDashboard } from "@/hooks/useDashboard";
import { env } from "@/config/env";
import { TOKEN_KEY } from "@/lib/axios";
import { setBeamsClient } from "@/lib/pushClient";

/**
 * Registers the browser with Pusher Beams for realtime push notifications.
 *
 * Credentials come from GET /user/dashboard:
 *   - pusher_credentials.instanceId → the Beams instance
 *   - notification_id               → this user's Beams user id
 * The Beams device token is minted by GET /user/pusher/beams-auth (Bearer auth),
 * which returns `{ token }`.
 *
 * The SDK is imported dynamically so it only ever loads in the browser (this is
 * a static-export SPA — the module must not run during prerender).
 */
export function PushNotifications() {
  const qc = useQueryClient();
  const { data: res } = useDashboard();
  const d = (res as { data?: Record<string, unknown> } | undefined)?.data;
  const instanceId = d?.pusher_credentials && (d.pusher_credentials as { instanceId?: string }).instanceId;
  const notificationId = d?.notification_id as string | undefined;

  const clientRef = useRef<Client | null>(null);
  const initedForRef = useRef<string | null>(null);

  // Refresh the in-app notification list + dashboard when a push arrives while
  // the app is open (the service worker forwards the payload to the page).
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      console.log("[Beams] page received SW message:", event.data);
      if (event.data?.type === "PUSHER_BEAMS_NOTIFICATION") {
        console.log("[Beams] push payload → refetching notifications + dashboard");
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [qc]);

  // Register the device with Beams once the credentials are available.
  useEffect(() => {
    if (!instanceId || !notificationId) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || typeof Notification === "undefined") return;

    let cancelled = false;
    let permStatus: PermissionStatus | null = null;

    const register = async () => {
      if (cancelled) return;

      console.log("[Beams] step 1 — starting registration", { instanceId, notificationId });
      console.log("[Beams] step 2 — Notification.permission =", Notification.permission);

      // Blocked at the browser level — Beams can't even prompt. The permission
      // watcher below retries automatically the moment the user unblocks it.
      if (Notification.permission === "denied") {
        console.warn(
          "[Beams] BLOCKED — push notifications are blocked for this site. Enable them via the browser's site settings (lock icon → Notifications → Allow).",
        );
        return;
      }

      // Guard against duplicate registration for the same user (Strict Mode / refetch).
      if (initedForRef.current === notificationId) {
        console.log("[Beams] already registered for this user — skipping");
        return;
      }
      initedForRef.current = notificationId;

      try {
        const token = window.localStorage.getItem(TOKEN_KEY);
        if (!token) {
          console.warn("[Beams] step 3 FAILED — no auth token in localStorage");
          return;
        }
        console.log("[Beams] step 3 — auth token found");

        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("[Beams] step 4 — service worker registered, scope:", registration.scope);

        const PusherPushNotifications = await import("@pusher/push-notifications-web");
        if (cancelled) return;

        const client = new PusherPushNotifications.Client({
          instanceId,
          serviceWorkerRegistration: registration,
        });
        clientRef.current = client;
        setBeamsClient(client);

        const tokenProvider = new PusherPushNotifications.TokenProvider({
          url: `${env.apiUrl}/user/pusher/beams-auth`,
          headers: { Authorization: `Bearer ${token}` },
        });

        await client.start(); // triggers the browser's permission prompt if not yet decided
        if (cancelled) return;
        console.log("[Beams] step 5 — client.start() OK (device registered with Pusher)");

        // Beams forbids changing the userId on an already-registered device.
        // If this browser still holds another user's registration (account
        // switch, or an old instance/test user), wipe it and start fresh.
        const existingUserId = await client.getUserId();
        console.log("[Beams] step 6 — existing userId on this device:", existingUserId || "(none)");
        if (existingUserId && existingUserId !== notificationId) {
          console.log("[Beams] step 6b — userId mismatch → clearing old state and re-registering");
          await client.stop();
          if (cancelled) return; 
          await client.start();
          if (cancelled) return;
        }

        await client.setUserId(notificationId, tokenProvider);
        console.log("[Beams] step 7 — setUserId OK → registered as:", notificationId);

        const [state, deviceId] = await Promise.all([client.getRegistrationState(), client.getDeviceId()]);
        console.log("[Beams] step 8 — DONE ✅ registrationState:", state, "| deviceId:", deviceId);
        console.log("[Beams] now waiting for pushes… (backend must publish to user:", notificationId + ")");
      } catch (error) {
        // Non-fatal: permission denied, unsupported browser, auth failure, or an
        // invalid Beams instance. Clear the guard so a later permission change
        // can retry; warn (not error) so it doesn't surface as a red overlay.
        initedForRef.current = null;
        console.warn(
          "[Beams] registration FAILED:",
          error instanceof Error ? error.message : error,
        );
      }
    };

    register();

    // Retry automatically when the user flips the permission to "Allow" from
    // the browser UI — no reload needed.
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((status) => {
          if (cancelled) return;
          permStatus = status;
          status.onchange = () => {
            if (status.state === "granted") register();
          };
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (permStatus) permStatus.onchange = null;
    };
  }, [instanceId, notificationId]);

  return null;
}
