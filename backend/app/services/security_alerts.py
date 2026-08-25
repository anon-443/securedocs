from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AlertSeverity
from app.models.security import SecurityAlert


def create_security_alert(
    db: Session,
    *,
    severity: AlertSeverity,
    title: str,
    description: str,
    user_id: str | None = None,
    source_event_id: str | None = None,
) -> SecurityAlert:
    """Create a deduplicated unresolved alert for a security-relevant condition."""

    existing = db.scalar(
        select(SecurityAlert).where(
            SecurityAlert.title == title,
            SecurityAlert.user_id == user_id,
            SecurityAlert.is_resolved.is_(False),
        )
    )
    if existing:
        return existing
    alert = SecurityAlert(
        severity=severity,
        title=title,
        description=description,
        user_id=user_id,
        source_event_id=source_event_id,
    )
    db.add(alert)
    return alert
