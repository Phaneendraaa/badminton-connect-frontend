/**
 * StompContext.js
 *
 * Provides a single, app-wide STOMP connection shared by all screens.
 * Instead of each screen (MatchChat, PostDetail, MatchPlay, etc.) creating
 * its own SockJS connection, they all subscribe through this one client.
 *
 * Key design decisions:
 *  - One Client instance per login session (created after user is set,
 *    destroyed on logout via cleanup in AuthContext).
 *  - subscribe() returns an unsubscribe function so callers can clean up
 *    on unmount without touching the underlying connection.
 *  - The client reconnects automatically (reconnectDelay: 5000ms).
 *  - On reconnect, all active subscriptions are re-registered automatically
 *    by the @stomp/stompjs library.
 *
 * Usage:
 *   const { subscribe, isConnected } = useStomp();
 *
 *   useEffect(() => {
 *     const unsub = subscribe("/topic/some-topic", (data) => {
 *       // data is already JSON.parse'd
 *     });
 *     return () => unsub();
 *   }, [subscribe]);
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "../utils/authStorage";

const BASE_URL = "http://10.0.2.2:8082";

const StompContext = createContext(null);

export function StompProvider({ userId, children }) {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return; // Not logged in yet

    let mounted = true;

    const connect = async () => {
      const token = await getAccessToken();
      if (!token || !mounted) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          if (mounted) setIsConnected(true);
        },
        onStompError: () => {
          if (mounted) setIsConnected(false);
        },
        onDisconnect: () => {
          if (mounted) setIsConnected(false);
        },
      });

      client.activate();
      clientRef.current = client;
    };

    connect();

    return () => {
      mounted = false;
      clientRef.current?.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [userId]); // Reconnect whenever userId changes (login/logout)

  /**
   * Subscribe to a STOMP topic.
   *
   * @param {string}   topic     - STOMP destination, e.g. "/topic/user/123/notifications"
   * @param {function} onMessage - Called with the parsed JSON payload on each message
   * @returns {function}         - Call this to unsubscribe (safe to call even if not yet connected)
   */
  const subscribe = useCallback((topic, onMessage) => {
    const client = clientRef.current;
    if (!client) return () => {};

    // If already connected, subscribe now; otherwise wait for onConnect
    let subscription = null;

    const doSubscribe = () => {
      try {
        subscription = client.subscribe(topic, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            onMessage(data);
          } catch (_) {
            // Malformed frame — ignore
          }
        });
      } catch (err) {
        console.warn("[Stomp] subscribe failed:", topic, err.message);
      }
    };

    if (client.connected) {
      doSubscribe();
    } else {
      // Queue the subscription for when the client connects/reconnects
      const originalOnConnect = client.onConnect;
      client.onConnect = (...args) => {
        originalOnConnect?.(...args);
        doSubscribe();
      };
    }

    return () => {
      try {
        subscription?.unsubscribe();
      } catch (_) {}
    };
  }, []); // No deps — clientRef is a ref, not state

  return (
    <StompContext.Provider value={{ subscribe, isConnected, clientRef }}>
      {children}
    </StompContext.Provider>
  );
}

export function useStomp() {
  const ctx = useContext(StompContext);
  if (!ctx) throw new Error("useStomp must be used inside <StompProvider>");
  return ctx;
}
