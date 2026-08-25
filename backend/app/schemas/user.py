from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import UserRole


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    profile_image_key: str | None = Field(default=None, max_length=512)

    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.split())


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


class UserManagementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    email_verified_at: datetime | None
    last_login_at: datetime | None
    failed_login_count: int
    created_at: datetime


class PersonalActivityResponse(BaseModel):
    id: str
    event_type: str
    outcome: str
    entity_type: str | None
    entity_id: str | None
    created_at: datetime
