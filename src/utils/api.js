import { getAccessToken, getRefreshToken, saveTokens, clearAuth } from "./authStorage";

const BASE_URL = "http://10.0.2.2:8082";

const api = async (endpoint, options = {}) => {
  let token = await getAccessToken();
  console.log("base url is",`${BASE_URL}`);
  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // If unauthorized and we're not already trying to refresh or login
  if (response.status === 401 && endpoint !== "/auth/refresh-token" && endpoint !== "/auth/login/verify-otp") {
    const refreshToken = await getRefreshToken();
    
    if (refreshToken) {
      try {
        
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Save new tokens
          await saveTokens(data.accessToken, data.refreshToken);
          
          // Retry the original request
          response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.accessToken}`,
              ...options.headers,
            },
          });
        } else {
          // Refresh failed (e.g. revoked or expired) -> logout
          await clearAuth();
          throw new Error("SESSION_EXPIRED");
        }
      } catch (error) {
        await clearAuth();
        throw new Error("SESSION_EXPIRED");
      }
    } else {
      // No refresh token available
      await clearAuth();
      throw new Error("UNAUTHORIZED");
    }
  }

  return response;
};

export default api;