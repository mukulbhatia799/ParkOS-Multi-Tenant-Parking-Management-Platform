import { createContext, useContext, useState, ReactNode } from "react";
import { AuthUser } from "../types";
import * as authApi from "../api/auth.api";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const existing = localStorage.getItem("token");
    return existing ? decodeUser(existing) : null;
  });

  async function login(email: string, password: string) {
    const result = await authApi.login(email, password);
    localStorage.setItem("token", result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function signup(email: string, password: string, name?: string) {
    const result = await authApi.signup(email, password, name);
    localStorage.setItem("token", result.token);
    setToken(result.token);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
