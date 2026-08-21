import { FormEvent, useState } from "react";
import { api, ApiError } from "../api/client";

export default function LoginPage({ onAuthed }: { onAuthed: () => void }) {
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
      onAuthed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered-page">
      <div className="card auth-card">
        <h1>SHADOW</h1>
        <p className="subtitle">Executive Intelligence — sign in to talk to your AI executive team.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={10}
            required
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
              />
              <label htmlFor="orgSlug">Organization slug</label>
              <input
                id="orgSlug"
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                required
              />
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
        </form>
      </div>
    </div>
  );
}
