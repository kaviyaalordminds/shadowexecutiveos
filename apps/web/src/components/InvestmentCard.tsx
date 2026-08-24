import { EvaluateInvestmentResult } from "../api/client";

const RISK_CLASS: Record<string, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  "NEVER BREAKS EVEN": "high",
};

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function InvestmentCard({ data }: { data: EvaluateInvestmentResult }) {
  const riskClass = RISK_CLASS[data.risk_tier] ?? "neutral";
  const { assumptions, analysis } = data;

  return (
    <div className="tool-card enter">
      <div className="tool-card-head">
        <div>
          <div className="tool-card-title">{data.initiative_name}</div>
          <span className={`badge ${riskClass}`}>{data.risk_tier} risk</span>
        </div>
      </div>

      <div className="response-section">
        <span className="evidence-tag assumption">Assumption</span>
        <span className="muted" style={{ fontSize: 12 }}>
          Initial {money(assumptions.initial_cost)} · {money(assumptions.monthly_cost)}/mo cost ·{" "}
          {money(assumptions.expected_monthly_revenue + assumptions.expected_monthly_savings)}/mo benefit ·{" "}
          {assumptions.horizon_months}mo horizon
        </span>
      </div>

      <div className="metric-row">
        <div className="metric-box">
          <div className="kpi-label">Payback period</div>
          <div className="kpi-value">
            {analysis.payback_period_months === null ? "Never" : `${analysis.payback_period_months} mo`}
          </div>
        </div>
        <div className="metric-box">
          <div className="kpi-label">ROI ({assumptions.horizon_months}mo)</div>
          <div className="kpi-value">
            {analysis.roi_pct_over_horizon === null ? "N/A" : `${analysis.roi_pct_over_horizon}%`}
          </div>
        </div>
        <div className="metric-box">
          <div className="kpi-label">Net return</div>
          <div className="kpi-value">{money(analysis.net_return_over_horizon)}</div>
        </div>
        <div className="metric-box">
          <div className="kpi-label">Monthly net</div>
          <div className="kpi-value">{money(analysis.monthly_net_contribution)}</div>
        </div>
      </div>

      <div className="response-section">
        <span className="evidence-tag analysis">Analysis</span>
        <span className="muted" style={{ fontSize: 12 }}>{data.risk_reason}</span>
      </div>
      <div className="response-section">
        <span className="evidence-tag recommendation">Recommendation</span>
        <span style={{ fontSize: 13 }}>{data.recommendation}</span>
      </div>
    </div>
  );
}
