"""
Central configuration for the AI service, loaded from environment variables.
Nothing sensitive is hard-coded — see section 51 of the spec ("Never
hard-code sensitive credentials into agent configuration").
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_port: int = 8000
    ai_service_internal_token: str = "change_me_internal_token"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"


settings = Settings()
