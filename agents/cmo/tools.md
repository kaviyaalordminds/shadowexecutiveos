# SHADOW CMO — Tools

## score_lead
Scores a company as a marketing/web-services lead from pasted LinkedIn
company/post/comment text (or a Sales Navigator CSV row), using the same
rubric as the `linkedin-lead-analyzer` skill:

- Signals of digital-marketing/website need (stale site language, "coming
  soon" pages, no clear CTA, outdated tech mentions, recent funding/hiring
  surges without matching digital presence, competitor comparisons, etc.)
- Company sizing and buying-power signals
- Recency/activity signals (are they actively posting/hiring/growing?)

Returns: `score` (0–100), `rationale`, `signals[]`, and a **draft** outreach
message for human review. Never sends anything automatically.
