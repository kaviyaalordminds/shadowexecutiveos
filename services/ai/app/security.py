"""
Service-to-service auth: the Node.js API gateway is the only caller allowed
to reach this internal API. This is a shared-secret bearer token, not a
substitute for the gateway's own user-facing auth — the AI service never
sees end-user credentials, only an already-authenticated request forwarded
by the gateway (per section 41: AI agents are treated as privileged
components, not public endpoints).
"""
from fastapi import Header, HTTPException, status

from .config import settings


async def verify_internal_token(x_internal_token: str = Header(default="")) -> None:
    if not x_internal_token or x_internal_token != settings.ai_service_internal_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service token.",
        )
