"""
score_lead tool — the linkedin-lead-analyzer logic, exposed as a real
function-calling tool the cmo_agent can invoke (spec section 7: tool/
function calling; section 29: CMO owns campaign/lead analysis).

This is a rule-based scorer (transparent, auditable, no hidden LLM call
inside a tool) that looks for signals a marketing/web-services agency would
care about: stale or missing digital presence, growth signals without
matching digital investment, and buying-power signals. It never contacts
LinkedIn or any external service — it only scores text the user pasted in,
per the "never scrapes, never sends" boundary the source skill defines.
"""
import re
from typing import Any

# (pattern, weight, signal label) — deliberately simple and inspectable
# rather than a black-box score, per section 57 (AI confidence must be
# backed by real evidence, not a fabricated precision number).
_NEED_SIGNALS: list[tuple[str, int, str]] = [
    (r"\bcoming soon\b", 18, "Site or section still says 'coming soon'"),
    (r"\bunder construction\b", 18, "Site marked under construction"),
    (r"\bwebsite (down|broken|not working)\b", 20, "Reported broken/down website"),
    (r"\bwe(?:'|’)re hiring\b|\bwe are hiring\b|\bnow hiring\b", 10, "Actively hiring — growth without confirmed digital investment"),
    (r"\bfunding\b|\braised \$|\bseries [abc]\b", 12, "Recent funding signal"),
    (r"\bno website\b|\bdon(?:'|’)t have a website\b", 22, "Explicitly no website"),
    (r"\brebrand(?:ing)?\b", 10, "Rebranding — likely needs matching digital refresh"),
    (r"\blooking for (a )?(marketing|web|digital) (agency|help|partner)\b", 25, "Explicit ask for marketing/web help"),
    (r"\bold website\b|\boutdated (site|website)\b", 20, "Self-reported outdated site"),
    (r"\bnew (product|launch)\b", 8, "New product/launch — needs go-to-market support"),
]

_NEGATIVE_SIGNALS: list[tuple[str, int, str]] = [
    (r"\bin-house (marketing|design|dev) team\b", -15, "Has an in-house team already"),
    (r"\bnot looking\b|\bnot currently hiring (an )?agency\b", -20, "Explicitly not looking for an agency"),
]


def score_lead(company_name: str, source_text: str) -> dict[str, Any]:
    text = source_text.lower()
    score = 35  # baseline: unknown company, no signal either way
    signals: list[str] = []

    for pattern, weight, label in _NEED_SIGNALS:
        if re.search(pattern, text):
            score += weight
            signals.append(label)

    for pattern, weight, label in _NEGATIVE_SIGNALS:
        if re.search(pattern, text):
            score += weight
            signals.append(label)

    score = max(0, min(100, score))

    if score >= 70:
        tier = "Hot"
    elif score >= 45:
        tier = "Warm"
    else:
        tier = "Cold"

    rationale = (
        f"{tier} lead ({score}/100). "
        + (
            "Signals found: " + "; ".join(signals) + "."
            if signals
            else "No strong need or disqualifying signals found in the supplied text — "
            "score reflects the neutral baseline, not confidence that this is a good fit."
        )
    )

    suggested_message = (
        f"Hi — I noticed {company_name} {(signals[0].lower() if signals else 'recently posted an update')}. "
        "We help companies like yours modernize their web presence and marketing systems. "
        "Would it be worth a quick chat this week? "
        "[DRAFT — review and personalize before sending; SHADOW does not send this automatically]"
    )

    return {
        "company_name": company_name,
        "score": score,
        "tier": tier,
        "rationale": rationale,
        "signals": signals,
        "suggested_message": suggested_message,
    }
