import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, clearTokens, getAccessToken } from "./api";

interface User {
  id: string;
  name: string;
  role: "MASTER" | "CUSTOMER" | "ADMIN";
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await api<{ user?: User }>("/api/mobile/auth/session");
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
