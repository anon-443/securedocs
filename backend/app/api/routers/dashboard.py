from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DbSession
from app.models.document import Document
from app.models.enums import DocumentStatus, UserRole
from app.models.security import AuditEvent, SecurityAlert
from app.models.user import User
from app.schemas.dashboard import ActivityResponse, DashboardOverviewResponse, SecurityAlertResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _document_scope(statement, user: User):
    if user.role == UserRole.EMPLOYEE:
        return statement.where(Document.owner_user_id == user.id)
    return statement


@router.get("/overview", response_model=DashboardOverviewResponse)
def overview(db: DbSession, current_user: CurrentUser) -> DashboardOverviewResponse:
    base = _document_scope(select(func.count()).select_from(Document).where(Document.status != DocumentStatus.DELETED), current_user)
    total_documents = db.scalar(base) or 0
    approved_documents = db.scalar(
        _document_scope(
            select(func.count()).select_from(Document).where(Document.status == DocumentStatus.APPROVED), current_user
        )
    ) or 0
    pending_review_documents = db.scalar(
        _document_scope(
            select(func.count()).select_from(Document).where(Document.status == DocumentStatus.PENDING_REVIEW), current_user
        )
    ) or 0
    if current_user.role != UserRole.ADMIN:
        return DashboardOverviewResponse(
            total_documents=total_documents,
            approved_documents=approved_documents,
            pending_review_documents=pending_review_documents,
            total_users=None,
            failed_login_attempts=None,
            unresolved_alerts=None,
        )
    return DashboardOverviewResponse(
        total_documents=total_documents,
        approved_documents=approved_documents,
        pending_review_documents=pending_review_documents,
        total_users=db.scalar(select(func.count()).select_from(User)) or 0,
        failed_login_attempts=db.scalar(select(func.coalesce(func.sum(User.failed_login_count), 0))) or 0,
        unresolved_alerts=db.scalar(
            select(func.count()).select_from(SecurityAlert).where(SecurityAlert.is_resolved.is_(False))
        ) or 0,
    )


@router.get("/activity", response_model=list[ActivityResponse])
def activity(
    db: DbSession, current_user: CurrentUser, limit: int = Query(default=15, ge=1, le=100)
) -> list[ActivityResponse]:
    if current_user.role == UserRole.EMPLOYEE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Activity monitoring is not available for this role.")
    events = db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)).all()
    return [
        ActivityResponse(
            id=event.id,
            event_type=event.event_type,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            outcome=event.outcome,
            actor_user_id=event.actor_user_id,
            created_at=event.created_at,
        )
        for event in events
    ]


@router.get("/security-alerts", response_model=list[SecurityAlertResponse])
def security_alerts(db: DbSession, current_user: CurrentUser) -> list[SecurityAlertResponse]:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Security alerts are limited to administrators.")
    alerts = db.scalars(
        select(SecurityAlert).where(SecurityAlert.is_resolved.is_(False)).order_by(SecurityAlert.created_at.desc())
    ).all()
    return [
        SecurityAlertResponse(
            id=alert.id,
            severity=alert.severity,
            title=alert.title,
            description=alert.description,
            is_resolved=alert.is_resolved,
            created_at=alert.created_at,
        )
        for alert in alerts
    ]
