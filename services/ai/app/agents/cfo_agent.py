"""
cfo_agent — loads its system prompt from agents/cfo/system_prompt.md (same
file layout as cmo_agent, per spec section 49), exposes evaluate_investment
as an Anthropic tool-use tool, and runs the same single tool-call round
trip as cmo_agent: model decides whether to call evaluate_investment, we
execute it locally (never letting the model run arbitrary code — section
41), then we send the tool result back for a final natural-language
answer. This is the second agent proving the architecture needs no rewrite
to add an executive (section 70).
"""
from pathlib import Path
from typing import Any

from ..router import route
from ..tools.financial_evaluation import evaluate_investment

_AGENT_KEY = "cfo_agent"
_SYSTEM_PROMPT_PATH = (
    Path(__file__).resolve().parents[4] / "agents" / "cfo" / "system_prompt.md"
)

EVALUATE_INVESTMENT_TOOL = {
    "name": "evaluate_investment",
    "description": (
        "Evaluate the financial soundness of a proposed initiative or "
        "investment from cost/revenue figures the user supplies. Use this "
        "whenever the user asks you to assess ROI, payback period, or "
        "financial risk for a specific initiative — never estimate these "
        "from memory."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "initiative_name": {"type": "string", "description": "Name of the initiative or investment."},
            "initial_cost": {"type": "number", "description": "One-time upfront cost."},
            "monthly_cost": {"type": "number", "description": "Ongoing monthly cost (default 0)."},
            "expected_monthly_revenue": {"type": "number", "description": "Expected new monthly revenue (default 0)."},
            "expected_monthly_savings": {"type": "number", "description": "Expected monthly cost savings (default 0)."},
            "horizon_months": {"type": "integer", "description": "Evaluation horizon in months (default 12)."},
        },
        "required": ["initiative_name", "initial_cost"],
    },
}


def _load_system_prompt() -> str:
    try:
        return _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return (
            "You are SHADOW CFO, the financial intelligence executive. "
            "(Warning: system_prompt.md not found on disk, using fallback.)"
        )


async def run(
    *, messages: list[dict[str, str]], temperature: float = 0.3
) -> dict[str, Any]:
    system_prompt = _load_system_prompt()
    decision = route(agent_key=_AGENT_KEY, preferred_model="claude-sonnet-4-5")

    first = await decision.provider.complete(
        system_prompt=system_prompt,
        messages=messages,
        tools=[EVALUATE_INVESTMENT_TOOL],
        temperature=temperature,
        model=decision.model,
    )

    tool_call_records: list[dict[str, Any]] = []

    if first["tool_use"]:
        tool_results_text: list[str] = []
        for call in first["tool_use"]:
            if call["name"] == "evaluate_investment":
                output = evaluate_investment(**call["input"])
            else:
                output = {"error": f"Unknown tool '{call['name']}'"}
            tool_call_records.append(
                {"tool_name": call["name"], "input": call["input"], "output": output}
            )
            tool_results_text.append(f"Tool `{call['name']}` result: {output}")

        followup_messages = messages + [
            {"role": "assistant", "content": first["content"] or "(requested a tool call)"},
            {"role": "user", "content": "\n\n".join(tool_results_text) +
                "\n\nUse this real tool output to answer the original question. "
                "Do not re-invent the numbers."},
        ]
        final = await decision.provider.complete(
            system_prompt=system_prompt,
            messages=followup_messages,
            tools=[EVALUATE_INVESTMENT_TOOL],
            temperature=temperature,
            model=decision.model,
        )
        return {
            "agent_key": _AGENT_KEY,
            "content": final["content"],
            "tool_calls": tool_call_records,
            "model": final["model"],
            "provider": final["provider"],
            "token_usage": final.get("usage"),
        }

    return {
        "agent_key": _AGENT_KEY,
        "content": first["content"],
        "tool_calls": tool_call_records,
        "model": first["model"],
        "provider": first["provider"],
        "token_usage": first.get("usage"),
    }
