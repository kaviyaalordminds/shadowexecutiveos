import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { AGENTS } from "../agentConfig";
import AgentCard from "../components/AgentCard";
import AgentNetworkGraph from "../components/AgentNetworkGraph";
import ScoreRing from "../components/ScoreRing";
import { useAuth } from "../AuthContext";

const HEALTH_FACTORS = [
  { key: "strategy", label: "Strategic Score" },
  { key: "operations", label: "Operational Score" },
  { key: "technology", label: "Technology Score" },
  { key: "marketing", label: "Marketing Score" },
  { key: "finance", label: "Financial Score" },
  { key: "customer", label: "Customer Score" },
  { key: "security", label: "Security Score" },
  { key: "innovation", label: "Innovation Score" },
];

export default function CommandCenterPage() {
  const { user } = useAuth();
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [hotLeads, setHotLeads] = useState<number | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .leads()
      .then((rows) => {
        if (cancelled) return;
        setLeadCount(rows.length);
        setHotLeads(rows.filter((r) => r.score >= 70).length);
      })
      .catch((err) => {
        if (cancelled) return;
        setLeadsError(err instanceof ApiError ? err.message : "Could not load CMO activity.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stack-16 enter">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Command Center</p>
          <h1 className="page-title">Welcome back, {user?.displayName}</h1>
          <p className="page-desc">
            Unified executive intelligence layer for {user?.organizationId ? "your organization" : "SHADOW"}. Two
            of five executives are wired end to end in this build — SHADOW CMO and SHADOW CFO.
          </p>
        </div>
      </div>

      <section>
        <h2 className="section-title">Business Health</h2>
        <div className="glass" style={{ padding: 18 }}>
          <div className="row-12" style={{ marginBottom: 14 }}>
            <ScoreRing value={null} size={64} label="Overall business health" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Overall Business Health: unavailable</div>
              <p className="faint" style={{ fontSize: 12, margin: "4px 0 0", maxWidth: "60ch" }}>
                A composite score is only ever computed from real underlying factors (spec section 18) —
                nothing here is a placeholder number. Each factor below needs a connected data source before
                it can be scored.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4">
            {HEALTH_FACTORS.map((f) => (
              <div key={f.key} className="metric-box">
                <div className="kpi-label">{f.label}</div>
                <div className="kpi-value unknown">DATA REQUIRED</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Executive Team</h2>
        <div className="grid grid-cols-5">
          {AGENTS.map((agent) => {
            if (agent.key === "cmo") {
              return (
                <AgentCard
                  key={agent.key}
                  agent={agent}
                  stats={[
                    { label: "Leads scored", value: leadCount === null ? "—" : String(leadCount) },
                    { label: "Hot leads", value: hotLeads === null ? "—" : String(hotLeads) },
                  ]}
                  insight={
                    leadsError
                      ? leadsError
                      : leadCount === 0
                        ? "No leads scored yet. Open SHADOW CMO to score your first lead."
                        : leadCount === null
                          ? "Loading recent activity…"
                          : `${leadCount} lead${leadCount === 1 ? "" : "s"} scored via the score_lead tool.`
                  }
                />
              );
            }
            if (agent.key === "cfo") {
              return (
                <AgentCard
                  key={agent.key}
                  agent={agent}
                  insight="Evaluate an initiative in SHADOW CFO to see real ROI/payback/risk analysis here."
                />
              );
            }
            return <AgentCard key={agent.key} agent={agent} />;
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">Executive Collaboration Graph</h2>
        <div className="glass" style={{ padding: 20 }}>
          <AgentNetworkGraph />
        </div>
      </section>
    </div>
  );
}
