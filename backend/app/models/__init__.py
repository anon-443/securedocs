"""Import every model so Alembic metadata sees the complete SecureDocs schema."""

from app.models.document import (
    Category,
    Document,
    DocumentReview,
    DocumentVersion,
    VerificationEvent,
)
from app.models.security import AuditEvent, SecurityAlert
from app.models.user import EmailVerificationToken, PasswordResetToken, RefreshToken, User

__all__ = [
    "AuditEvent",
    "Category",
    "Document",
    "DocumentReview",
    "DocumentVersion",
    "EmailVerificationToken",
    "PasswordResetToken",
    "RefreshToken",
    "SecurityAlert",
    "User",
    "VerificationEvent",
]
