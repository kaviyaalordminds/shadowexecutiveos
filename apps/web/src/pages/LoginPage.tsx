import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { setAuthed } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("exec@demo-org.test");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [orgSlug, setOrgSlug] = useState("demo-org");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ email, password, displayName, organizationSlug: orgSlug });
      localStorage.setItem("shadow_access_token", result.accessToken);
      setAuthed(result.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card glass auth-card enter">
        <div className="auth-brand">
          <div className="auth-mark">S</div>
          <h1 className="auth-title">SHADOW EXECUTIVE AI</h1>
          <p className="auth-subtitle">Executive Intelligence System</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={10}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {mode === "register" && (
            <>
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
              <label htmlFor="orgSlug">Organization slug</label>
              <input id="orgSlug" type="text" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} required />
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Authenticating…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
        </form>

        <div className="secure-indicator">
          <span className="dot" /> Session secured — bcrypt + JWT
        </div>
      </div>
    </div>
  );
}
