import hashlib
import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.security import AuditEvent


def _safe_metadata(value: dict[str, Any] | None) -> str | None:
    if value is None:
        return None
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def append_audit_event(
    db: Session,
    *,
    event_type: str,
    actor_user_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    outcome: str = "success",
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditEvent:
    """Insert a tamper-evident audit event; callers commit it with the business transaction."""

    previous = db.scalar(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(1))
    previous_hash = previous.event_hash if previous else None
    metadata_json = _safe_metadata(metadata)
    payload = "|".join(
        [
            previous_hash or "",
            actor_user_id or "",
            event_type,
            entity_type or "",
            entity_id or "",
            outcome,
            metadata_json or "",
        ]
    )
    event_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    event = AuditEvent(
        actor_user_id=actor_user_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        outcome=outcome,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=metadata_json,
        previous_event_hash=previous_hash,
        event_hash=event_hash,
    )
    db.add(event)
    return event
