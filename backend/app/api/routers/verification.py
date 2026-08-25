import io

import qrcode
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select

from app.api.dependencies import DbSession
from app.core.config import get_settings
from app.models.document import Document, VerificationEvent
from app.models.enums import DocumentStatus
from app.schemas.dashboard import PublicVerificationResponse

router = APIRouter(prefix="/verify", tags=["Public Verification"])
limiter = Limiter(key_func=get_remote_address)


def _client_metadata(request: Request) -> tuple[str | None, str | None]:
    return request.client.host if request.client else None, request.headers.get("user-agent")


def _verification_url(reference_code: str) -> str:
    return f"{get_settings().public_verification_base_url.rstrip('/')}/{reference_code}"


@router.get("/{reference_code}", response_model=PublicVerificationResponse)
@limiter.limit("30/minute")
def verify_document(reference_code: str, request: Request, db: DbSession) -> PublicVerificationResponse:
    """Public endpoint intentionally returns no private file, owner, or category data."""
    normalized_code = reference_code.strip().upper()
    if not normalized_code.startswith("SD-") or len(normalized_code) > 32:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification record was not found.")
    document = db.scalar(
        select(Document).where(
            Document.reference_code == normalized_code,
            Document.status == DocumentStatus.APPROVED,
        )
    )
    ip_address, user_agent = _client_metadata(request)
    db.add(
        VerificationEvent(
            document_id=document.id if document else None,
            reference_code=normalized_code,
            outcome="verified" if document else "not_found",
            requester_ip=ip_address,
            user_agent=user_agent,
            is_public_request=True,
        )
    )
    db.commit()
    if document is None:
        return PublicVerificationResponse(
            verified=False,
            reference_code=normalized_code,
            status="not_found",
            message="No approved document matches this verification code.",
        )
    return PublicVerificationResponse(
        verified=True,
        reference_code=normalized_code,
        title=document.title,
        status=document.status.value,
        approved_at=document.approved_at,
        message="This document reference is valid and approved.",
    )


@router.get("/{reference_code}/qr", response_class=Response)
@limiter.limit("30/minute")
def verification_qr(reference_code: str, request: Request, db: DbSession) -> Response:
    normalized_code = reference_code.strip().upper()
    if not normalized_code.startswith("SD-") or len(normalized_code) > 32:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification record was not found.")
    document = db.scalar(
        select(Document).where(
            Document.reference_code == normalized_code,
            Document.status == DocumentStatus.APPROVED,
        )
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification record was not found.")
    qr = qrcode.QRCode(version=3, box_size=8, border=2)
    qr.add_data(_verification_url(normalized_code))
    qr.make(fit=True)
    image = qr.make_image(fill_color="#0E253D", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return Response(content=buffer.getvalue(), media_type="image/png", headers={"Cache-Control": "public, max-age=300"})
