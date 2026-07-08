/**
 * pushNotifications.js
 *
 * Centralizes all Expo push notification logic:
 *  - Requesting permission and getting the Expo push token
 *  - Caching the token in SecureStore so we don't spam the backend on every launch
 *  - Registering / deregistering the token with the backend
 *
 * Usage:
 *   import { registerPushToken, deregisterPushToken } from "./pushNotifications";
 *
 *   // on login / app cold-start:
 *   await registerPushToken();
 *
 *   // on logout:
 *   await deregisterPushToken();
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import api from "./api";

const PUSH_TOKEN_CACHE_KEY = "expoPushToken";

// ── Token acquisition ─────────────────────────────────────────────────────────

/**
 * Requests notification permission, retrieves the Expo push token, and
 * returns it. Returns null on simulators, when permission is denied, or
 * on any error.
 */
async function getOrRequestPushToken() {
  // Push notifications only work on real devices
  if (!Device.isDevice) {
    console.log("[Push] Skipping — not a real device");
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission denied");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data; // "ExponentPushToken[xxxx]"
  } catch (err) {
    console.warn("[Push] Failed to get push token:", err);
    return null;
  }
}

// ── Register ──────────────────────────────────────────────────────────────────

/**
 * Gets the push token, compares it against the locally-cached value, and
 * if different (or not yet sent) registers it with the backend.
 *
 * Safe to call on every app launch — the cache comparison prevents
 * spamming the backend with the same token repeatedly.
 */
export async function registerPushToken() {
  const token = await getOrRequestPushToken();
  if (!token) return;

  try {
    const cached = await SecureStore.getItemAsync(PUSH_TOKEN_CACHE_KEY);
    if (cached === token) {
      // Same token already registered — skip the network call
      return;
    }

    const res = await api("/user/push-token", {
      method: "POST",
      body: JSON.stringify({ pushToken: token }),
    });

    if (res.ok) {
      // Cache the successfully-registered token
      await SecureStore.setItemAsync(PUSH_TOKEN_CACHE_KEY, token);
      console.log("[Push] Token registered:", token.slice(-10));
    } else {
      console.warn("[Push] Backend rejected token, status:", res.status);
    }
  } catch (err) {
    // Network error — will retry on next launch
    console.warn("[Push] Failed to register token:", err.message);
  }
}

// ── Deregister ────────────────────────────────────────────────────────────────

/**
 * Clears the push token from the backend and from local cache on logout.
 * After this call, the device will no longer receive pushes for this user.
 */
export async function deregisterPushToken() {
  try {
    await api("/user/push-token", { method: "DELETE" });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_CACHE_KEY);
    console.log("[Push] Token deregistered");
  } catch (err) {
    // Non-fatal — token will eventually expire on the backend side
    console.warn("[Push] Failed to deregister token:", err.message);
  }
}
