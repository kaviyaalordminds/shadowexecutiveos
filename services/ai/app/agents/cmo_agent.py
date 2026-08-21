"""
cmo_agent — loads its system prompt from agents/cmo/system_prompt.md (the
same file a human editor maintains, per spec section 49's agent directory
layout), exposes score_lead as an Anthropic tool-use tool, and runs a single
tool-call round trip: model decides whether to call score_lead, we execute
it locally (never letting the model run arbitrary code — section 41), then
we send the tool result back for a final natural-language answer.
"""
from pathlib import Path
from typing import Any

from ..router import route
from ..tools.lead_scoring import score_lead

_AGENT_KEY = "cmo_agent"
_SYSTEM_PROMPT_PATH = (
    Path(__file__).resolve().parents[4] / "agents" / "cmo" / "system_prompt.md"
)

SCORE_LEAD_TOOL = {
    "name": "score_lead",
    "description": (
        "Score a company as a marketing/website-services lead based on "
        "pasted LinkedIn company page, post, or comment text. Use this "
        "whenever the user asks you to evaluate, qualify, or score a "
        "specific company as a potential lead — never estimate a score "
        "from memory."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "company_name": {"type": "string", "description": "The company's name."},
            "source_text": {
                "type": "string",
                "description": "The raw pasted LinkedIn text (page/post/comment) or CSV row for this company.",
            },
        },
        "required": ["company_name", "source_text"],
    },
}


def _load_system_prompt() -> str:
    try:
        return _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return (
            "You are SHADOW CMO, the marketing and growth executive. "
            "(Warning: system_prompt.md not found on disk, using fallback.)"
        )


async def run(
    *, messages: list[dict[str, str]], temperature: float = 0.4
) -> dict[str, Any]:
    system_prompt = _load_system_prompt()
    decision = route(agent_key=_AGENT_KEY, preferred_model="claude-sonnet-4-5")

    first = await decision.provider.complete(
        system_prompt=system_prompt,
        messages=messages,
        tools=[SCORE_LEAD_TOOL],
        temperature=temperature,
        model=decision.model,
    )

    tool_call_records: list[dict[str, Any]] = []

    if first["tool_use"]:
        # Execute every requested tool call locally (deterministic, no
        # model-controlled code execution), then ask the model to produce
        # its final answer using the real tool output.
        tool_results_text: list[str] = []
        for call in first["tool_use"]:
            if call["name"] == "score_lead":
                output = score_lead(**call["input"])
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
                "Do not re-invent a score."},
        ]
        final = await decision.provider.complete(
            system_prompt=system_prompt,
            messages=followup_messages,
            tools=[SCORE_LEAD_TOOL],
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
