"""
AIProvider abstraction (spec section 65). Every model call in the system
goes through this interface so the application is never hard-coded to a
single vendor. Swapping OpenAIProvider / AnthropicProvider / a future
LocalModelProvider in requires no changes outside this module + registration
in the provider registry.
"""
from abc import ABC, abstractmethod
from typing import Any, Optional


class AIProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def complete(
        self,
        *,
        system_prompt: str,
        messages: list[dict[str, str]],
        tools: Optional[list[dict[str, Any]]] = None,
        temperature: float = 0.4,
        model: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Returns a normalized response shape:
            {
              "content": str,
              "tool_use": [{"name": str, "input": dict, "id": str}] | [],
              "model": str,
              "provider": str,
              "usage": {"input_tokens": int, "output_tokens": int} | None,
            }
        """
        raise NotImplementedError
