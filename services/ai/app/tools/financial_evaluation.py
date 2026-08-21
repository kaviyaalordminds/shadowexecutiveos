"""
evaluate_investment tool — the CFO's "Budget Management" and "Financial
Decision Engine" logic from the spec (section 9), exposed as a real
function-calling tool the cfo_agent can invoke.

This is a rule-based calculator (transparent, auditable, no hidden LLM call
inside a tool) that turns user-supplied cost/revenue projections into ROI,
payback period, and a financial risk tier. It never fetches or fabricates
real financial data — every number in the output is either restated from
the caller's input (ASSUMPTION) or derived from it by plain arithmetic
(ANALYSIS), per section 3.2's evidence-based decision principle.
"""
from typing import Any, Optional


def evaluate_investment(
    initiative_name: str,
    initial_cost: float,
    monthly_cost: float = 0.0,
    expected_monthly_revenue: float = 0.0,
    expected_monthly_savings: float = 0.0,
    horizon_months: int = 12,
) -> dict[str, Any]:
    if horizon_months <= 0:
        horizon_months = 12

    monthly_benefit = expected_monthly_revenue + expected_monthly_savings
    monthly_net = monthly_benefit - monthly_cost

    total_cost = initial_cost + monthly_cost * horizon_months
    total_benefit = monthly_benefit * horizon_months
    net_return = total_benefit - total_cost
    roi_pct = (net_return / total_cost * 100) if total_cost > 0 else None

    payback_period_months: Optional[float]
    if monthly_net > 0:
        payback_period_months = round(initial_cost / monthly_net, 1)
    else:
        payback_period_months = None  # never recoups the initial cost at these inputs

    if payback_period_months is None:
        risk_tier = "NEVER BREAKS EVEN"
        risk_reason = (
            "Monthly cost meets or exceeds monthly revenue + savings, so the "
            "initial cost is never recouped at these inputs."
        )
    elif payback_period_months <= 6:
        risk_tier = "LOW"
        risk_reason = "Payback period is 6 months or less."
    elif payback_period_months <= 18:
        risk_tier = "MEDIUM"
        risk_reason = "Payback period is between 6 and 18 months."
    else:
        risk_tier = "HIGH"
        risk_reason = "Payback period exceeds 18 months."

    if risk_tier == "NEVER BREAKS EVEN":
        recommendation = (
            f"Do not approve '{initiative_name}' as currently modeled — it does not "
            "break even at the supplied cost/revenue assumptions. Either reduce "
            "monthly cost, increase expected monthly benefit, or treat this as a "
            "non-financial (strategic) investment and get explicit human approval "
            "for the ongoing loss."
        )
    elif risk_tier == "HIGH":
        recommendation = (
            f"'{initiative_name}' breaks even, but slowly ({payback_period_months} "
            "months). Approve only if the strategic value justifies tying up "
            f"capital for that long, or revisit the assumptions."
        )
    else:
        recommendation = (
            f"'{initiative_name}' breaks even in {payback_period_months} months "
            f"with an estimated {round(roi_pct, 1) if roi_pct is not None else 'N/A'}% "
            f"ROI over {horizon_months} months, based on the supplied assumptions."
        )

    return {
        "initiative_name": initiative_name,
        "assumptions": {
            "initial_cost": initial_cost,
            "monthly_cost": monthly_cost,
            "expected_monthly_revenue": expected_monthly_revenue,
            "expected_monthly_savings": expected_monthly_savings,
            "horizon_months": horizon_months,
        },
        "analysis": {
            "monthly_net_contribution": round(monthly_net, 2),
            "total_cost_over_horizon": round(total_cost, 2),
            "total_benefit_over_horizon": round(total_benefit, 2),
            "net_return_over_horizon": round(net_return, 2),
            "roi_pct_over_horizon": round(roi_pct, 1) if roi_pct is not None else None,
            "payback_period_months": payback_period_months,
        },
        "risk_tier": risk_tier,
        "risk_reason": risk_reason,
        "recommendation": recommendation,
    }
