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
