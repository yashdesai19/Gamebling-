from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "9XBET API"
    environment: str = "development"

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: str = ""

    # Razorpay (Payment Links)
    razorpay_key_id: str | None = Field(default=None, validation_alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str | None = Field(default=None, validation_alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str | None = Field(default=None, validation_alias="RAZORPAY_WEBHOOK_SECRET")
    public_app_url: str | None = Field(default=None, validation_alias="PUBLIC_APP_URL")

    # CricAPI (live IPL sync) — env key: CRICKET_API_KEY
    cricapi_base_url: str = Field(default="https://api.cricapi.com/v1", validation_alias="CRICAPI_BASE_URL")
    cricapi_api_key: str | None = Field(default=None, validation_alias="CRICKET_API_KEY")
    cricapi_timeout_seconds: int = Field(default=15, validation_alias="CRICAPI_TIMEOUT_SECONDS")

    # RapidAPI (schedule/live fallback)
    rapidapi_key: str | None = Field(default=None, validation_alias="X-RapidAPI-Key")
    rapidapi_host: str = Field(default="cricket-api-free-data.p.rapidapi.com", validation_alias="X-RapidAPI-Host")
    rapidapi_timeout_seconds: int = Field(default=20, validation_alias="RAPIDAPI_TIMEOUT_SECONDS")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _normalize_cors_origins(cls, v):
        # Always keep this as a string to avoid pydantic-settings JSON parsing for list types.
        if v is None:
            return ""
        if isinstance(v, list):
            return ",".join(str(x) for x in v)
        return str(v)

    def cors_origins_list(self) -> list[str]:
        s = (self.cors_origins or "").strip()
        if not s:
            return []
        return [o.strip() for o in s.split(",") if o.strip()]


settings = Settings()

