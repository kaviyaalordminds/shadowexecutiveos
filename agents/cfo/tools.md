# SHADOW CFO — Tools

## evaluate_investment
Evaluates the financial soundness of a proposed initiative or investment
from figures the user supplies (initial cost, ongoing monthly cost,
expected monthly revenue and/or savings, and an optional time horizon),
using real, auditable arithmetic rather than a guessed ROI:

- Total cost and total benefit over the evaluation horizon
- Net return and ROI %
- Monthly net contribution
- Payback period (months to recoup the initial cost), or a flag that the
  initiative never breaks even at the given inputs
- A financial risk tier (`LOW` / `MEDIUM` / `HIGH` / `NEVER BREAKS EVEN`)
  derived transparently from payback period and monthly net — not a
  black-box score

Returns a structured breakdown labeling every figure as either a restated
`ASSUMPTION` (the inputs, as supplied by the user — not verified actuals)
or computed `ANALYSIS` (the arithmetic derived from those inputs), plus a
`RECOMMENDATION` string. All inputs are exactly the numbers passed in; the
tool never fetches or invents real financial data.
