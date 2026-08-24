import { FormEvent, useState } from "react";
import { api, ApiError, EvaluateInvestmentResult, ToolCall } from "../api/client";
import { agentByKey } from "../agentConfig";
import ExecutiveChat from "../components/ExecutiveChat";
import InvestmentCard from "../components/InvestmentCard";

const agent = agentByKey("cfo")!;

const FINANCIAL_KPIS = [
  "Revenue",
  "Expenses",
  "Profit",
  "Cash",
  "Cash Flow",
  "Burn Rate",
  "Runway",
  "Gross Margin",
];

export default function CfoPage() {
  const [name, setName] = useState("");
  const [initialCost, setInitialCost] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("0");
  const [monthlyRevenue, setMonthlyRevenue] = useState("0");
  const [monthlySavings, setMonthlySavings] = useState("0");
  const [horizon, setHorizon] = useState("12");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluateInvestmentResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  async function handleEvaluate(e: FormEvent) {
    e.preventDefault();
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await api.evaluateInvestment({
        initiativeName: name,
        initialCost: Number(initialCost),
        monthlyCost: Number(monthlyCost) || 0,
        expectedMonthlyRevenue: Number(monthlyRevenue) || 0,
        expectedMonthlySavings: Number(monthlySavings) || 0,
        horizonMonths: Number(horizon) || 12,
      });
      setResult(res);
    } catch (err) {
      setEvalError(err instanceof ApiError ? err.message : "Could not evaluate this initiative.");
    } finally {
      setEvaluating(false);
    }
  }

  function renderToolCall(call: ToolCall) {
    if (call.tool_name === "evaluate_investment") {
      return <InvestmentCard data={call.output as unknown as EvaluateInvestmentResult} />;
    }
    return null;
  }

  const accentStyle = { ["--agent-accent" as string]: `var(${agent.accentVar})`, ["--agent-accent-soft" as string]: `var(${agent.accentVar}-soft)` };

  return (
    <div className="stack-16 enter" style={accentStyle}>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{agent.domain}</p>
          <h1 className="page-title">{agent.name} — Financial Command Center</h1>
          <p className="page-desc">{agent.coreQuestion} Budgets, forecasting, investment analysis and financial risk.</p>
        </div>
        <span className="status-pill active">
          <span className="dot" /> Active
        </span>
      </div>

      <section>
        <h2 className="section-title">Financial Overview</h2>
        <div className="grid grid-cols-4">
          {FINANCIAL_KPIS.map((k) => (
            <div key={k} className="card kpi-card">
              <span className="kpi-label">{k}</span>
              <span className="kpi-value unknown">UNKNOWN</span>
            </div>
          ))}
        </div>
        <p className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
          No accounting/banking integration is connected — SHADOW never fabricates revenue, expense or cash
          figures. Connect a real financial data source to activate this section.
        </p>
      </section>

      <div className="workspace-layout">
        <section>
          <h2 className="section-title">Executive AI Workspace</h2>
          <ExecutiveChat
            agent={agent}
            suggestedQuestions={[
              "Evaluate a $12,000 upfront + $500/mo CRM expecting $2,000/mo in savings.",
              "What does SHADOW CFO own vs. SHADOW CEO?",
              "What financial risks should I watch for a new initiative?",
            ]}
            renderToolCall={renderToolCall}
          />
        </section>

        <aside className="side-stack">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 10 }}>
              Evaluate an Investment
            </h2>
            <form onSubmit={handleEvaluate}>
              <label htmlFor="initName">Initiative name</label>
              <input id="initName" value={name} onChange={(e) => setName(e.target.value)} required />
              <label htmlFor="initialCost">Initial cost ($)</label>
              <input id="initialCost" type="number" min={0} value={initialCost} onChange={(e) => setInitialCost(e.target.value)} required />
              <label htmlFor="monthlyCost">Monthly cost ($)</label>
              <input id="monthlyCost" type="number" min={0} value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} />
              <label htmlFor="monthlyRevenue">Expected monthly revenue ($)</label>
              <input id="monthlyRevenue" type="number" min={0} value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} />
              <label htmlFor="monthlySavings">Expected monthly savings ($)</label>
              <input id="monthlySavings" type="number" min={0} value={monthlySavings} onChange={(e) => setMonthlySavings(e.target.value)} />
              <label htmlFor="horizon">Horizon (months)</label>
              <input id="horizon" type="number" min={1} value={horizon} onChange={(e) => setHorizon(e.target.value)} />
              <button type="submit" className="btn-primary" disabled={evaluating} style={{ marginTop: 14, width: "100%" }}>
                {evaluating ? "Evaluating…" : "Evaluate"}
              </button>
              {evalError && <div className="error-banner">{evalError}</div>}
            </form>
            {result && (
              <div style={{ marginTop: 14 }}>
                <InvestmentCard data={result} />
              </div>
            )}
          </div>
        </aside>
      </div>

      <section>
        <h2 className="section-title">Forecasting Center</h2>
        <div className="coming-soon">
          <div className="coming-soon-badge">Coming soon</div>
          <div className="coming-soon-title">Conservative / Base / Aggressive scenarios not implemented</div>
          <p className="faint" style={{ maxWidth: 480, margin: "0 auto", fontSize: 12.5 }}>
            Multi-scenario forecasting needs a real revenue/cost baseline to project from — none is connected yet.
          </p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Budget Management</h2>
        <div className="coming-soon">
          <div className="coming-soon-badge">Coming soon</div>
          <div className="coming-soon-title">Department budgets are not implemented</div>
          <p className="faint" style={{ maxWidth: 480, margin: "0 auto", fontSize: 12.5 }}>
            Budget vs. actual tracking requires a budgets backend that does not exist in this build.
          </p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Financial Risk Center</h2>
        <div className="coming-soon">
          <div className="coming-soon-badge">Coming soon</div>
          <div className="coming-soon-title">No financial risk feed connected</div>
          <p className="faint" style={{ maxWidth: 480, margin: "0 auto", fontSize: 12.5 }}>
            Cash-flow risk, budget overruns and anomaly detection need transaction data SHADOW does not have
            access to yet.
          </p>
        </div>
      </section>
    </div>
  );
}
