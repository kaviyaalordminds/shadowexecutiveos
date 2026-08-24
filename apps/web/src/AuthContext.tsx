import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, ApiError, CurrentUser, getToken } from "./api/client";

type AuthStatus = "checking" | "authed" | "anon";

interface AuthState {
  status: AuthStatus;
  user: CurrentUser | null;
  setAuthed: (user: CurrentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setStatus("anon");
      return;
    }
    // Re-validate the stored token against the backend rather than trusting
    // its mere presence — this is what makes "refresh page while logged in"
    // and "expired/invalid session" behave correctly.
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authed");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          localStorage.removeItem("shadow_access_token");
        }
        setStatus("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setAuthed(nextUser: CurrentUser) {
    setUser(nextUser);
    setStatus("authed");
  }

  function logout() {
    localStorage.removeItem("shadow_access_token");
    setUser(null);
    setStatus("anon");
  }

  return (
    <AuthContext.Provider value={{ status, user, setAuthed, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
