import { createContext, useContext, useEffect, useState } from "react";
import { saveTokens, saveUser, getAccessToken, getUser, clearAuth } from "../utils/authStorage";
import api from "../utils/api";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Load session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await getAccessToken();
        let storedUser = await getUser();
        if (storedToken) {
          setToken(storedToken);
          
          // Re-fetch current user if stored user or userId is missing
          if (!storedUser || !storedUser.userId) {
            console.log("[AuthContext] Session restore: Stored user or userId is missing. Re-fetching from /current/user...");
            try {
              const res = await api("/current/user");
              if (res.ok) {
                const userData = await res.json();
                const userId = userData.userId || userData.id;
                if (userId) {
                  storedUser = {
                    ...storedUser,
                    ...userData,
                    userId: userId,
                    id: userId,
                  };
                  await saveUser(storedUser);
                  console.log("[AuthContext] Successfully re-fetched and saved user:", storedUser);
                }
              } else {
                console.warn("[AuthContext] Failed to re-fetch user. Response status:", res.status);
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
    const userId = userDetails.userId || userDetails.id;
    const stableUser = {
      ...userDetails,
      userId: userId,
      id: userId,
    };
    await saveTokens(accessToken, refreshToken);
    await saveUser(stableUser);
    setToken(accessToken);
    setUser(stableUser);
    setIsNewUser(newUser);
  };

  
  // Call this on logout
  const logout = async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, login, logout, loading, phoneNumber, setPhoneNumber,setIsNewUser,isNewUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);