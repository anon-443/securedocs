from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded only from trusted environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        enable_decoding=False,
    )

    app_name: str = "SecureDocs API"
    app_env: Literal["development", "test", "staging", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"

    database_url: str = Field(
        default="postgresql+psycopg://securedocs:change-me@localhost:5432/securedocs",
        validation_alias=AliasChoices("SECUREDOCS_DATABASE_URL", "DATABASE_URL"),
    )

    jwt_secret_key: SecretStr = SecretStr("development-only-jwt-secret-must-be-replaced-in-production-2026")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=15, ge=5, le=60)
    refresh_token_expire_days: int = Field(default=7, ge=1, le=30)
    password_reset_expire_minutes: int = Field(default=30, ge=10, le=120)
    email_verification_expire_hours: int = Field(default=24, ge=1, le=168)
    csrf_secret_key: SecretStr = SecretStr("development-only-csrf-secret-must-be-replaced-in-production-2026")

    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_domain: str | None = None
    frontend_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    trusted_hosts: list[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])

    rate_limit_login_per_minute: int = Field(default=5, ge=1, le=30)
    rate_limit_public_verify_per_minute: int = Field(default=30, ge=1, le=120)

    storage_backend: Literal["local", "s3", "managed"] = "local"
    storage_bucket: str = "securedocs-documents"
    storage_region: str = "us-east-1"
    s3_endpoint_url: str | None = None
    s3_access_key_id: SecretStr | None = None
    s3_secret_access_key: SecretStr | None = None
    managed_storage_api_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("BUILT_IN_FORGE_API_URL", "MANAGED_STORAGE_API_URL"),
    )
    managed_storage_api_key: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("BUILT_IN_FORGE_API_KEY", "MANAGED_STORAGE_API_KEY"),
    )
    max_upload_bytes: int = Field(default=10_485_760, ge=1_048_576, le=52_428_800)
    allowed_content_types: list[str] = Field(
        default_factory=lambda: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/webp",
        ]
    )

    mail_from: str = "no-reply@example.com"
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_starttls: bool = True
    email_verification_frontend_url: str = "http://localhost:5173/verify-email"
    password_reset_frontend_url: str = "http://localhost:5173/reset-password"
    public_verification_base_url: str = "http://localhost:5173/verify"

    @field_validator("frontend_origins", "trusted_hosts", "allowed_content_types", mode="before")
    @classmethod
    def split_comma_separated_values(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        normalized = value.replace("\\u0026", "&").replace("&amp;", "&")
        if normalized.startswith("postgresql://"):
            return normalized.replace("postgresql://", "postgresql+psycopg://", 1)
        if normalized.startswith("postgres://"):
            return normalized.replace("postgres://", "postgresql+psycopg://", 1)
        return normalized

    @field_validator("app_env", mode="before")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        aliases = {"prod": "production", "dev": "development"}
        return aliases.get(value.strip().lower(), value.strip().lower())


@lru_cache
def get_settings() -> Settings:
    return Settings()
