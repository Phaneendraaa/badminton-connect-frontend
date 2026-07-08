import { createContext, useContext, useEffect, useState } from "react";
import { saveTokens, saveUser, getAccessToken, getUser, clearAuth } from "../utils/authStorage";
import api from "../utils/api";
import { registerPushToken, deregisterPushToken } from "../utils/pushNotifications";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await getAccessToken();
        let storedUser = await getUser();
        if (storedToken) {
          setToken(storedToken);
          
          // Re-fetch current user if stored user or userId is missing.
          // /current/user now always returns { userId, phoneNumber, phoneVerified }.
          if (!storedUser || !storedUser.userId) {
            console.log("[AuthContext] Session restore: stored user or userId missing. Re-fetching from /current/user...");
            try {
              const res = await api("/current/user");
              if (res.ok) {
                const userData = await res.json();
                // userData.userId is guaranteed by the API; keep || userData.id
                // only as a safety net for devices with old cached responses.
                const userId = userData.userId || userData.id;
                if (userId) {
                  storedUser = {
                    ...storedUser,
                    ...userData,
                    userId,
                    id: userId, // keep id in sync for any legacy screen reads
                  };
                  await saveUser(storedUser);
                  console.log("[AuthContext] Re-fetched user:", storedUser);
                }
              } else {
                console.warn("[AuthContext] Failed to re-fetch user — status:", res.status);
              }
            } catch (err) {
              console.error("[AuthContext] Error re-fetching user identity:", err);
            }
          }
          
          if (storedUser) {
            // Ensure userId is consistently mapped from id if it exists
            if (!storedUser.userId && storedUser.id) {
              storedUser.userId = storedUser.id;
              await saveUser(storedUser);
            }
            setUser(storedUser);
            // Register push token now that we have a valid session.
            // Fire-and-forget — must not block the session restore.
            registerPushToken().catch(() => {});
            // Load initial unread badge count
            fetchUnreadCount();
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error loading session:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  // Call this after login API response
  const login = async (accessToken, refreshToken, userDetails, newUser) => {
    // userDetails comes from the login verify-otp response (LoginResponseDto).
    // Keep the || id fallback so old app versions that stored id still work.
    const userId = userDetails.userId || userDetails.id;
    const stableUser = {
      ...userDetails,
      userId,
      id: userId, // keep id in sync for any legacy screen reads
    };
    await saveTokens(accessToken, refreshToken);
    await saveUser(stableUser);
    setToken(accessToken);
    setUser(stableUser);
    setIsNewUser(newUser);
    // Register push token after successful login.
    // Fire-and-forget — must not delay navigation to next screen.
    registerPushToken().catch(() => {});
    // Load initial unread badge count
    fetchUnreadCount();
  };

  
  // Call this on logout
  const logout = async () => {
    // Deregister push token BEFORE clearing auth so the DELETE /user/push-token
    // request still has a valid access token attached.
    await deregisterPushToken().catch(() => {});
    await clearAuth();
    setToken(null);
    setUser(null);
    setIsNewUser(false);
    setUnreadCount(0);
  };

  /**
   * Fetches the current unread notification count from the REST endpoint.
   * Used as the source of truth on cold-start and after socket reconnect.
   * The STOMP subscription in App.js keeps this up-to-date live thereafter.
   */
  const fetchUnreadCount = async () => {
    try {
      const res = await api("/notifications/unread-count");
      if (res.ok) {
        const d = await res.json();
        setUnreadCount(d.count || 0);
      }
    } catch (_) {
      // Non-critical — badge will update via STOMP
    }
  };

  return (
    <AuthContext.Provider value={{
      token, setToken,
      user, login, logout, loading,
      phoneNumber, setPhoneNumber,
      setIsNewUser, isNewUser,
      unreadCount, setUnreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);