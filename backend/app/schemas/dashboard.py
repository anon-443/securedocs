from datetime import datetime

from pydantic import BaseModel

from app.models.enums import AlertSeverity


class DashboardOverviewResponse(BaseModel):
    total_documents: int
    approved_documents: int
    pending_review_documents: int
    total_users: int | None
    failed_login_attempts: int | None
    unresolved_alerts: int | None


class ActivityResponse(BaseModel):
    id: str
    event_type: str
    entity_type: str | None
    entity_id: str | None
    outcome: str
    actor_user_id: str | None
    created_at: datetime


class SecurityAlertResponse(BaseModel):
    id: str
    severity: AlertSeverity
    title: str
    description: str
    is_resolved: bool
    created_at: datetime


class PublicVerificationResponse(BaseModel):
    verified: bool
    reference_code: str
    title: str | None = None
    status: str
    approved_at: datetime | None = None
    message: str
