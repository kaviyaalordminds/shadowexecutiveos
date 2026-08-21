"""
SHADOW AI service — Python internal API consumed only by the Node.js API
gateway (spec section 3: "Python should expose secure internal APIs to the
Node.js backend"). This vertical slice implements two agents (cmo_agent,
cfo_agent) end to end; additional agents plug in the same way: a
system_prompt.md under agents/<key>/, a runner module under app/agents/,
and a route registered below — no other architectural change required
(spec section 70).
"""
from fastapi import Depends, FastAPI, HTTPException

from .agents import cfo_agent, cmo_agent
from .config import settings
from .schemas import (
    AgentChatRequest,
    AgentChatResponse,
    EvaluateInvestmentRequest,
    ScoreLeadRequest,
)
from .security import verify_internal_token
from .tools.financial_evaluation import evaluate_investment
from .tools.lead_scoring import score_lead

app = FastAPI(title="SHADOW AI Service", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "shadow-ai"}


@app.post(
    "/internal/v1/agents/cmo_agent/chat",
    response_model=AgentChatResponse,
    dependencies=[Depends(verify_internal_token)],
)
async def cmo_agent_chat(payload: AgentChatRequest) -> AgentChatResponse:
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    result = await cmo_agent.run(
        messages=[m.model_dump() for m in payload.messages]
    )
    return AgentChatResponse(**result)


@app.post(
    "/internal/v1/tools/score_lead",
    dependencies=[Depends(verify_internal_token)],
)
async def score_lead_tool(payload: ScoreLeadRequest) -> dict:
    """
    Exposed directly too (not only via agent chat) so the frontend's
    'paste leads and score' flow can call the tool without a full chat
    round trip when that's all the user wants.
    """
    return score_lead(company_name=payload.company_name, source_text=payload.source_text)


@app.post(
    "/internal/v1/agents/cfo_agent/chat",
    response_model=AgentChatResponse,
    dependencies=[Depends(verify_internal_token)],
)
async def cfo_agent_chat(payload: AgentChatRequest) -> AgentChatResponse:
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    result = await cfo_agent.run(
        messages=[m.model_dump() for m in payload.messages]
    )
    return AgentChatResponse(**result)


@app.post(
    "/internal/v1/tools/evaluate_investment",
    dependencies=[Depends(verify_internal_token)],
)
async def evaluate_investment_tool(payload: EvaluateInvestmentRequest) -> dict:
    """
    Exposed directly too, mirroring score_lead, so a 'model this initiative'
    flow can call the tool without a full chat round trip.
    """
    return evaluate_investment(
        initiative_name=payload.initiative_name,
        initial_cost=payload.initial_cost,
        monthly_cost=payload.monthly_cost,
        expected_monthly_revenue=payload.expected_monthly_revenue,
        expected_monthly_savings=payload.expected_monthly_savings,
        horizon_months=payload.horizon_months,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.ai_service_port, reload=True)
