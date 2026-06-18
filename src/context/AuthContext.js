import { createContext, useContext, useEffect, useState } from "react";
import { saveTokens, saveUser, getAccessToken, getUser, clearAuth } from "../utils/authStorage";

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
      const storedToken = await getAccessToken();
      const storedUser = await getUser();
      if (storedToken) {
        setToken(storedToken);
        setUser(storedUser);
      }
      setLoading(false);
    };
    loadSession();
  }, []);

  // Call this after login API response
  const login = async (accessToken, refreshToken, userDetails, newUser) => {
    await saveTokens(accessToken, refreshToken);
    await saveUser(userDetails);
    setToken(accessToken);
    setUser(userDetails);
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