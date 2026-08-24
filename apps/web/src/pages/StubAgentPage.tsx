import { useParams } from "react-router-dom";
import { agentByKey } from "../agentConfig";

export default function StubAgentPage() {
  const { key } = useParams<{ key: string }>();
  const agent = agentByKey(key ?? "");

  if (!agent) {
    return (
      <div className="data-required">
        <strong>Unknown agent</strong>
        <span>No agent is registered for "{key}".</span>
      </div>
    );
  }

  const style = { ["--agent-accent" as string]: `var(${agent.accentVar})` };

  return (
    <div className="enter" style={style}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{agent.domain}</p>
          <h1 className="page-title">{agent.name}</h1>
          <p className="page-desc">{agent.role} — {agent.coreQuestion}</p>
        </div>
        <span className="status-pill offline">
          <span className="dot" /> Not implemented
        </span>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-badge">Not configured</div>
        <div className="coming-soon-title">{agent.name} is not wired to a backend agent yet</div>
        <p className="faint" style={{ maxWidth: 520, margin: "0 auto", fontSize: 12.5 }}>
          Only SHADOW CMO and SHADOW CFO are implemented end to end in this build (system
          prompt + tool + AI service route + database seed row). Adding {agent.name} follows
          the same pattern documented in the project README — no fake chat or fabricated
          data will be shown here until that agent actually exists.
        </p>
      </div>
    </div>
  );
}
