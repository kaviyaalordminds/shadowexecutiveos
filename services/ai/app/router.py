"""
model_router (spec section 66). Given task/agent characteristics, picks the
best available model + provider. This vertical slice only wires the
Anthropic provider, but the router's job — deciding, not calling — is the
real contract future providers (OpenAI, local models) plug into.
"""
from dataclasses import dataclass
from typing import Literal

from .providers.anthropic_provider import AnthropicProvider
from .providers.base import AIProvider

TaskComplexity = Literal["simple", "standard", "complex"]

_PROVIDERS: dict[str, AIProvider] = {
    "anthropic": AnthropicProvider(),
}


@dataclass
class RoutingDecision:
    provider: AIProvider
    model: str
    reason: str


def route(
    *,
    agent_key: str,
    task_complexity: TaskComplexity = "standard",
    privacy_sensitive: bool = False,
    preferred_provider: str = "anthropic",
    preferred_model: str = "claude-sonnet-4-5",
) -> RoutingDecision:
    """
    Minimal routing policy for this slice: honor the agent's configured
    provider/model. The hook points for real routing logic (cost limits,
    latency requirements, local/private fallback) are the function
    parameters above — extend this function, not the callers.
    """
    provider = _PROVIDERS.get(preferred_provider)
    if provider is None:
        raise ValueError(f"Unknown provider '{preferred_provider}'")

    reason = f"agent={agent_key} complexity={task_complexity} provider={preferred_provider}"
    return RoutingDecision(provider=provider, model=preferred_model, reason=reason)
