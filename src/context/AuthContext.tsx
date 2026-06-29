import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService";
import { onAuthFailure, setAccessToken, setRefreshToken } from "../utils/apiClient";
import type { User, AuthResponse } from "../types";

const REFRESH_TOKEN_KEY = "nexa_refresh_token";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (data: { email: string; firstName: string; lastName: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateToken: (token: string | null) => void;
  storeRefreshToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");
  return ctx;
};

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateToken = useCallback((token: string | null) => {
    setAccessTokenState(token);
    setAccessToken(token);
  }, []);

  const storeRefreshToken = useCallback((token: string | null) => {
    setRefreshToken(token);
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      updateToken(null);
      storeRefreshToken(null);
      setUser(null);
      navigate("/login");
    };
    onAuthFailure(handler);
  }, [navigate, updateToken, storeRefreshToken]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (savedRefreshToken) {
        storeRefreshToken(savedRefreshToken);
        try {
          const refresh: AuthResponse = await authService.refresh();
          if (cancelled) return;
          if (refresh?.accessToken) {
            updateToken(refresh.accessToken);
            if (refresh.refreshToken) storeRefreshToken(refresh.refreshToken);
            const me: User = await authService.me();
            if (!cancelled) setUser(me);
          }
        } catch {
          storeRefreshToken(null);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [updateToken, storeRefreshToken]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    const result = await authService.login({ email, password });
    if (result?.accessToken) {
      updateToken(result.accessToken);
      if (result.refreshToken) storeRefreshToken(result.refreshToken);
    }
    if (result?.user) setUser(result.user);
    return result;
  }, [updateToken, storeRefreshToken]);

  const signup = useCallback(async ({ email, firstName, lastName, password }: { email: string; firstName: string; lastName: string; password: string }): Promise<AuthResponse> => {
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
    const result = await authService.signup({ username, email, firstName, lastName, password });
    if (result?.accessToken) {
      updateToken(result.accessToken);
      if (result.refreshToken) storeRefreshToken(result.refreshToken);
    }
    if (result?.user) setUser(result.user);
    return result;
  }, [updateToken, storeRefreshToken]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort
    }
    updateToken(null);
    storeRefreshToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate, updateToken, storeRefreshToken]);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({ user, accessToken, loading, isAuthenticated, login, signup, logout, updateToken, storeRefreshToken }),
    [user, accessToken, loading, isAuthenticated, login, signup, logout, updateToken, storeRefreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
