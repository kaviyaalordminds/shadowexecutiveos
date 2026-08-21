from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant", "system", "tool"]
    content: str


class AgentChatRequest(BaseModel):
    organization_id: str
    user_id: str
    conversation_id: str
    messages: list[ChatMessageIn] = Field(default_factory=list)


class ToolCallRecord(BaseModel):
    tool_name: str
    input: dict[str, Any]
    output: dict[str, Any]


class AgentChatResponse(BaseModel):
    agent_key: str
    content: str
    tool_calls: list[ToolCallRecord] = Field(default_factory=list)
    model: str
    provider: str
    token_usage: Optional[dict[str, int]] = None


class ScoreLeadRequest(BaseModel):
    organization_id: str
    company_name: str
    source_text: str


class EvaluateInvestmentRequest(BaseModel):
    organization_id: str
    initiative_name: str
    initial_cost: float
    monthly_cost: float = 0.0
    expected_monthly_revenue: float = 0.0
    expected_monthly_savings: float = 0.0
    horizon_months: int = 12
