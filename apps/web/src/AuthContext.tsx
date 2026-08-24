import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, ApiError, CurrentUser, getToken } from "./api/client";

type AuthStatus = "checking" | "authed" | "anon";

interface AuthState {
  status: AuthStatus;
  user: CurrentUser | null;
  devBypass: boolean;
  setAuthed: (user: CurrentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Development-only auth bypass, for building/testing the Dashboard UI
 * while the backend/Postgres auth chain is unavailable or broken. Gated
 * on two independent conditions so it can never activate in a production
 * build: `import.meta.env.DEV` is Vite's own build-mode flag (false in
 * `vite build` output, regardless of what's in .env), and
 * VITE_DEV_AUTH_BYPASS must be explicitly set to "true". Neither
 * condition alone is enough — both must hold.
 *
 * When active, this never touches the real auth API or PostgreSQL: no
 * /auth/login or /auth/register call is made, no token is stored. It's a
 * purely client-side, clearly-labeled fake session for UI development.
 */
export const DEV_AUTH_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

const DEV_USER: CurrentUser = {
  id: "dev-bypass-user",
  organizationId: "00000000-0000-0000-0000-000000000001",
  email: "dev@localhost",
  displayName: "Development User (auth bypassed)",
  role: "ADMIN",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(DEV_AUTH_BYPASS ? "authed" : "checking");
  const [user, setUser] = useState<CurrentUser | null>(DEV_AUTH_BYPASS ? DEV_USER : null);

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      // eslint-disable-next-line no-console
      console.warn(
        "[SHADOW] VITE_DEV_AUTH_BYPASS is active — authentication is skipped and the Dashboard is " +
          "showing a fake local dev user. Real API calls that require a token will still fail. " +
          "Set VITE_DEV_AUTH_BYPASS=false and restart Vite to restore normal auth.",
      );
      return;
    }
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
    if (DEV_AUTH_BYPASS) {
      // Re-apply the fake dev session instead of dropping to the login
      // screen — logging out isn't meaningful when there was never a
      // real session, and the whole point of bypass mode is staying on
      // the Dashboard.
      setUser(DEV_USER);
      setStatus("authed");
      return;
    }
    setUser(null);
    setStatus("anon");
  }

  return (
    <AuthContext.Provider value={{ status, user, devBypass: DEV_AUTH_BYPASS, setAuthed, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
