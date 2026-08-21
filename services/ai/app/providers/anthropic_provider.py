"""
Anthropic implementation of AIProvider. Falls back to a clearly-labeled
deterministic stub when no API key is configured, so the vertical slice
still runs end-to-end without live network/API access — this is explicit
in the response (never silently pretends to be a real model call).
"""
from typing import Any, Optional

from anthropic import AsyncAnthropic

from ..config import settings
from .base import AIProvider


class AnthropicProvider(AIProvider):
    name = "anthropic"

    def __init__(self) -> None:
        self._client: Optional[AsyncAnthropic] = (
            AsyncAnthropic(api_key=settings.anthropic_api_key)
            if settings.anthropic_api_key
            else None
        )

    async def complete(
        self,
        *,
        system_prompt: str,
        messages: list[dict[str, str]],
        tools: Optional[list[dict[str, Any]]] = None,
        temperature: float = 0.4,
        model: Optional[str] = None,
    ) -> dict[str, Any]:
        model_name = model or settings.anthropic_model

        if self._client is None:
            return self._stub_response(messages, model_name)

        anthropic_tools = tools or []
        response = await self._client.messages.create(
            model=model_name,
            max_tokens=1024,
            temperature=temperature,
            system=system_prompt,
            messages=[{"role": m["role"], "content": m["content"]} for m in messages],
            tools=anthropic_tools,
        )

        text_parts: list[str] = []
        tool_use: list[dict[str, Any]] = []
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_use.append({"name": block.name, "input": block.input, "id": block.id})

        return {
            "content": "\n".join(text_parts).strip(),
            "tool_use": tool_use,
            "model": model_name,
            "provider": self.name,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }

    @staticmethod
    def _stub_response(messages: list[dict[str, str]], model_name: str) -> dict[str, Any]:
        """
        Deterministic offline fallback used only when ANTHROPIC_API_KEY is
        unset. Clearly labeled so nobody mistakes it for a real model
        response — this exists purely so the vertical slice is runnable
        without external credentials during review.
        """
        last_user = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
        )
        return {
            "content": (
                "[OFFLINE STUB — no ANTHROPIC_API_KEY configured]\n\n"
                "SHADOW CMO would normally respond here using a real Claude "
                f"model. Your message was: \"{last_user[:300]}\". "
                "Set ANTHROPIC_API_KEY in services/ai/.env to get live responses."
            ),
            "tool_use": [],
            "model": model_name,
            "provider": "anthropic-stub",
            "usage": None,
        }
