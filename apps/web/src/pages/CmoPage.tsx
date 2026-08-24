import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, ScoreLeadResult, ToolCall } from "../api/client";
import { agentByKey } from "../agentConfig";
import ExecutiveChat from "../components/ExecutiveChat";
import LeadScoreCard from "../components/LeadScoreCard";

const agent = agentByKey("cmo")!;

const FUNNEL_STAGES = [
  { name: "Awareness", desc: "Prospects become aware of the brand." },
  { name: "Interest", desc: "Prospects engage with content or messaging." },
  { name: "Consideration", desc: "Prospects evaluate against alternatives." },
  { name: "Conversion", desc: "Prospects become customers." },
  { name: "Onboarding", desc: "New customers activate the product/service." },
  { name: "Retention", desc: "Customers continue to renew/purchase." },
  { name: "Referral", desc: "Customers refer new prospects." },
];

const MARKETING_KPIS = ["Leads", "Conversion Rate", "CAC", "LTV", "ROAS", "CTR", "Retention", "Churn"];

export default function CmoPage() {
  const [selectedStage, setSelectedStage] = useState(0);
  const [leads, setLeads] = useState<{ id: string; company_name: string; score: number; status: string; created_at: string }[] | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [scoring, setScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreLeadResult | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  function refreshLeads() {
    api
      .leads()
      .then(setLeads)
      .catch((err) => setLeadsError(err instanceof ApiError ? err.message : "Could not load leads."));
  }

  useEffect(refreshLeads, []);

  async function handleScore(e: FormEvent) {
    e.preventDefault();
    setScoring(true);
    setScoreError(null);
    try {
      const result = await api.scoreLead({ companyName, sourceText });
      setScoreResult(result);
      refreshLeads();
    } catch (err) {
      setScoreError(err instanceof ApiError ? err.message : "Could not score this lead.");
    } finally {
      setScoring(false);
    }
  }

  function renderToolCall(call: ToolCall) {
    if (call.tool_name === "score_lead") {
      return <LeadScoreCard data={call.output as unknown as LeadScoreCardData} />;
    }
    return null;
  }

  const accentStyle = { ["--agent-accent" as string]: `var(${agent.accentVar})`, ["--agent-accent-soft" as string]: `var(${agent.accentVar}-soft)` };

  return (
    <div className="stack-16 enter" style={accentStyle}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{agent.domain}</p>
          <h1 className="page-title">{agent.name} — Command Center</h1>
          <p className="page-desc">{agent.coreQuestion} Brand, demand generation, positioning, content and growth.</p>
        </div>
        <span className="status-pill active">
          <span className="dot" /> Active
        </span>
      </div>

      <section>
        <h2 className="section-title">Marketing Overview</h2>
        <div className="grid grid-cols-4">
          {MARKETING_KPIS.map((k) => (
            <div key={k} className="card kpi-card">
              <span className="kpi-label">{k}</span>
              <span className="kpi-value unknown">DATA REQUIRED</span>
            </div>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
          No campaign/analytics data source is connected yet — these will populate from real numbers only, never
          placeholders.
        </p>
      </section>

      <div className="workspace-layout">
        <section>
          <h2 className="section-title">Executive AI Workspace</h2>
          <ExecutiveChat
            agent={agent}
            suggestedQuestions={[
              "Score this lead: Acme Corp — hiring, site says coming soon, wants a marketing agency.",
              "What does SHADOW CMO own vs. SHADOW CFO?",
              "What should I check before launching a campaign?",
            ]}
            renderToolCall={renderToolCall}
          />
        </section>

        <aside className="side-stack">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 10 }}>
              Score a Lead
            </h2>
            <form onSubmit={handleScore}>
              <label htmlFor="companyName">Company name</label>
              <input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              <label htmlFor="sourceText">Pasted LinkedIn text / notes</label>
              <textarea
                id="sourceText"
                rows={4}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                required
                style={{ minHeight: 90 }}
              />
              <button type="submit" className="btn-primary" disabled={scoring} style={{ marginTop: 14, width: "100%" }}>
                {scoring ? "Scoring…" : "Score lead"}
              </button>
              {scoreError && <div className="error-banner">{scoreError}</div>}
            </form>
            {scoreResult && (
              <div style={{ marginTop: 14 }}>
                <LeadScoreCard data={scoreResult} />
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 10 }}>
              Recent Leads
            </h2>
            {leadsError && <div className="error-banner">{leadsError}</div>}
            {!leadsError && leads === null && <div className="skeleton" style={{ height: 60 }} />}
            {leads && leads.length === 0 && <p className="faint" style={{ fontSize: 12.5 }}>No leads scored yet.</p>}
            {leads && leads.length > 0 && (
              <div className="stack-8">
                {leads.slice(0, 6).map((l) => (
                  <div key={l.id} className="row-8" style={{ justifyContent: "space-between", fontSize: 12.5 }}>
                    <span>{l.company_name}</span>
                    <span className={`badge ${l.score >= 70 ? "hot" : l.score >= 45 ? "warm" : "cold"}`}>{l.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <section>
        <h2 className="section-title">Marketing Funnel</h2>
        <div className="glass" style={{ padding: 20 }}>
          <div className="funnel">
            {FUNNEL_STAGES.map((stage, i) => (
              <div
                key={stage.name}
                className={`funnel-stage ${selectedStage === i ? "selected" : ""}`}
                onClick={() => setSelectedStage(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedStage(i)}
              >
                <span className="funnel-index">{i + 1}</span>
                <div>
                  <div className="funnel-name">{stage.name}</div>
                  {selectedStage === i && <div className="funnel-desc">{stage.desc} — DATA REQUIRED for stage volume/conversion.</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Campaign Center</h2>
        <div className="coming-soon">
          <div className="coming-soon-badge">Coming soon</div>
          <div className="coming-soon-title">Campaign management is not implemented</div>
          <p className="faint" style={{ maxWidth: 480, margin: "0 auto", fontSize: 12.5 }}>
            No campaign backend exists yet (objective/audience/budget/CTA/status tracking). This will be built as
            a real CRUD API before any campaign UI is shown here.
          </p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Content Intelligence</h2>
        <div className="coming-soon">
          <div className="coming-soon-badge">Coming soon</div>
          <div className="coming-soon-title">Content workspace is not implemented</div>
          <p className="faint" style={{ maxWidth: 480, margin: "0 auto", fontSize: 12.5 }}>
            Generate/edit/approve/schedule for articles, social content and campaigns requires a content backend
            that does not exist in this build.
          </p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Market Intelligence</h2>
        <div className="coming-soon">
          <div className="coming-soon-badge">Coming soon</div>
          <div className="coming-soon-title">No connected research source</div>
          <p className="faint" style={{ maxWidth: 480, margin: "0 auto", fontSize: 12.5 }}>
            Competitor/market data will only be shown with a SOURCE, DATE and CONFIDENCE per the spec — never
            invented.
          </p>
        </div>
      </section>
    </div>
  );
}

type LeadScoreCardData = Parameters<typeof LeadScoreCard>[0]["data"];
