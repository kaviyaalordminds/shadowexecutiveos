import { useNavigate } from "react-router-dom";
import { AgentMeta } from "../agentConfig";

interface AgentCardProps {
  agent: AgentMeta;
  /** Short line of real, currently-known activity. Omit if nothing real to show. */
  insight?: string;
  stats?: { label: string; value: string }[];
}

export default function AgentCard({ agent, insight, stats }: AgentCardProps) {
  const navigate = useNavigate();
  const initials = agent.key.toUpperCase();
  const style = { ["--agent-accent" as string]: `var(${agent.accentVar})`, ["--agent-accent-soft" as string]: `var(${agent.accentVar}-soft)` };

  return (
    <div
      className="card card-interactive agent-card enter"
      style={style}
      role={agent.implemented ? "button" : undefined}
      tabIndex={agent.implemented ? 0 : undefined}
      onClick={() => agent.implemented && navigate(agent.path)}
      onKeyDown={(e) => {
        if (agent.implemented && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          navigate(agent.path);
        }
      }}
      aria-label={agent.implemented ? `Open ${agent.name}` : undefined}
    >
      <div className="agent-card-head">
        <div className="agent-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="agent-card-title">{agent.name}</div>
          <div className="agent-card-role">{agent.domain}</div>
        </div>
        {agent.implemented ? (
          <span className="status-pill active">
            <span className="dot" /> Active
          </span>
        ) : (
          <span className="status-pill offline">
            <span className="dot" /> Not built
          </span>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="agent-card-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="agent-stat-label">{s.label}</div>
              <div className="agent-stat-value">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="agent-card-insight">
        {insight ?? (agent.implemented ? "No activity recorded yet." : `${agent.role} is not implemented in this build.`)}
      </div>

      <button
        type="button"
        className={agent.implemented ? "btn-secondary" : "btn-ghost"}
        disabled={!agent.implemented}
        onClick={(e) => {
          e.stopPropagation();
          if (agent.implemented) navigate(agent.path);
        }}
      >
        {agent.implemented ? `Open ${agent.key.toUpperCase()}` : "Not configured"}
      </button>
    </div>
  );
}
