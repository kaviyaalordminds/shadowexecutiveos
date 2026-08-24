import { ReactNode, useState } from "react";
import { Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { AGENTS } from "../agentConfig";
import NetworkBackground from "./NetworkBackground";

interface NavEntry {
  label: string;
  path?: string;
  disabled?: boolean;
}

const INTELLIGENCE: NavEntry[] = [
  { label: "Decisions", disabled: true },
  { label: "Opportunities", disabled: true },
  { label: "Risks", disabled: true },
  { label: "KPIs", disabled: true },
];

const OPERATIONS: NavEntry[] = [
  { label: "Projects", disabled: true },
  { label: "Tasks", disabled: true },
  { label: "Workflows", disabled: true },
];

const KNOWLEDGE: NavEntry[] = [
  { label: "Documents", disabled: true },
  { label: "Knowledge Base", disabled: true },
  { label: "Memory", disabled: true },
];

const REPORTS: NavEntry[] = [
  { label: "Daily Brief", disabled: true },
  { label: "Weekly Review", disabled: true },
  { label: "Monthly Review", disabled: true },
];

/**
 * Every non-agent nav entry above is intentionally disabled: there is no
 * backend for decisions/risks/projects/knowledge/reports yet. Per the "no
 * fake features" rule, they're shown (matching the spec's sidebar
 * structure) but visibly inert rather than linking to pages that pretend
 * to work.
 */
export default function ExecutiveShell({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (status === "checking") {
    return (
      <>
        <NetworkBackground />
        <div className="auth-page">
          <div className="glass" style={{ padding: "20px 28px", fontSize: 13, color: "var(--text-muted)" }}>
            Verifying session…
          </div>
        </div>
      </>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace />;
  }

  const initials = (user?.displayName ?? user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <>
      <NetworkBackground />
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            ☰
          </button>
          <div className="brand">
            <span className="brand-mark">SHADOW</span>
            <span className="brand-sub">Executive Intelligence</span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="system-status">
            <span className="status-dot" /> System Online
          </span>
          <div className="user-chip">
            <span className="user-avatar">{initials}</span>
            <span>{user?.displayName}</span>
          </div>
          <button className="btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="app-shell">
        <div className={`sidebar-scrim ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
        <nav className={`sidebar ${drawerOpen ? "open" : ""}`} aria-label="Executive command center navigation">
          <div className="sidebar-section-label">Overview</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} onClick={() => setDrawerOpen(false)}>
            <span className="nav-dot" /> Command Center
          </NavLink>

          <div className="sidebar-section-label">Executive Team</div>
          {AGENTS.map((agent) => (
            <NavLink
              key={agent.key}
              to={agent.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setDrawerOpen(false)}
              style={{ ["--agent-accent" as string]: `var(${agent.accentVar})` }}
            >
              <span className="nav-dot" /> {agent.name.replace("SHADOW ", "")}
              {!agent.implemented && <span className="soon-tag">N/A</span>}
            </NavLink>
          ))}

          <NavSection title="Intelligence" items={INTELLIGENCE} />
          <NavSection title="Operations" items={OPERATIONS} />
          <NavSection title="Knowledge" items={KNOWLEDGE} />
          <NavSection title="Reports" items={REPORTS} />

          <div className="sidebar-section-label">System</div>
          <button className="nav-item disabled" disabled>
            <span className="nav-dot" /> Settings <span className="soon-tag">Soon</span>
          </button>
        </nav>

        <main className="main">{children}</main>
      </div>
    </>
  );
}

function NavSection({ title, items }: { title: string; items: NavEntry[] }) {
  return (
    <>
      <div className="sidebar-section-label">{title}</div>
      {items.map((item) => (
        <button key={item.label} className="nav-item disabled" disabled title="Not implemented in this build">
          <span className="nav-dot" /> {item.label} <span className="soon-tag">Soon</span>
        </button>
      ))}
    </>
  );
}
