import hashlib
import hmac
import json
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import Response

from app.api.dependencies import CurrentUser, DbSession, enforce_csrf
from app.models.document import Category, Document, VerificationEvent
from app.models.enums import DocumentStatus, UserRole
from app.schemas.document import (
    CategoryCreateRequest,
    CategoryResponse,
    DocumentResponse,
    DocumentReviewRequest,
    DocumentUpdateRequest,
    VerificationHistoryResponse,
    VerificationReportResponse,
)
from app.services.audit import append_audit_event
from app.services.documents import (
    _document_response,
    create_document,
    get_visible_document,
    list_visible_documents,
    review_document,
    soft_delete_document,
    update_document,
)
from app.services.storage import secure_download, secure_preview

router = APIRouter(prefix="/documents", tags=["Documents"])


def _client_metadata(request: Request) -> tuple[str | None, str | None]:
    return request.client.host if request.client else None, request.headers.get("user-agent")


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: DbSession, _: CurrentUser) -> list[CategoryResponse]:
    return [CategoryResponse.model_validate(category) for category in db.query(Category).order_by(Category.name).all()]


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(enforce_csrf)])
def create_category(payload: CategoryCreateRequest, db: DbSession, current_user: CurrentUser) -> CategoryResponse:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an administrator can create categories.")
    name = " ".join(payload.name.split())
    if db.query(Category).filter(Category.name.ilike(name)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A category with this name already exists.")
    category = Category(name=name, description=payload.description, created_by_user_id=current_user.id)
    db.add(category)
    db.flush()
    append_audit_event(db, event_type="category.created", actor_user_id=current_user.id, entity_type="category", entity_id=category.id)
    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: DbSession,
    current_user: CurrentUser,
    search: str | None = Query(default=None, max_length=100),
    category_id: str | None = None,
    status_filter: DocumentStatus | None = Query(default=None, alias="status"),
) -> list[DocumentResponse]:
    return list_visible_documents(
        db, actor=current_user, search=search, category_id=category_id, status_filter=status_filter
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(enforce_csrf)])
async def upload_document(
    request: Request,
    db: DbSession,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File(...)],
    title: Annotated[str, Form(...)],
    description: Annotated[str | None, Form()] = None,
    category_id: Annotated[str | None, Form()] = None,
) -> DocumentResponse:
    ip_address, user_agent = _client_metadata(request)
    document = await create_document(
        db,
        actor=current_user,
        file=file,
        title=title,
        description=description,
        category_id=category_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.commit()
    stored_document = db.get(Document, document.id)
    if stored_document is None:  # pragma: no cover - transaction guard
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Document persistence failed.")
    db.refresh(stored_document)
    return _document_response(stored_document)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: DbSession, current_user: CurrentUser) -> DocumentResponse:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    category = db.get(Category, document.category_id) if document.category_id else None
    return _document_response(document, category.name if category else None)


@router.patch("/{document_id}", response_model=DocumentResponse, dependencies=[Depends(enforce_csrf)])
def patch_document(document_id: str, payload: DocumentUpdateRequest, db: DbSession, current_user: CurrentUser) -> DocumentResponse:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    result = update_document(db, document=document, actor=current_user, changes=payload)
    db.commit()
    return result


@router.post("/{document_id}/review", response_model=DocumentResponse, dependencies=[Depends(enforce_csrf)])
def decide_document(
    document_id: str, payload: DocumentReviewRequest, db: DbSession, current_user: CurrentUser
) -> DocumentResponse:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    result = review_document(db, document=document, actor=current_user, decision=payload.decision, note=payload.note)
    db.commit()
    return result


@router.get("/{document_id}/download", response_model=None)
def download_document(document_id: str, request: Request, db: DbSession, current_user: CurrentUser) -> Response:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    ip_address, user_agent = _client_metadata(request)
    append_audit_event(
        db,
        event_type="document.downloaded",
        actor_user_id=current_user.id,
        entity_type="document",
        entity_id=document.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.commit()
    return secure_download(
        storage_key=document.storage_key,
        original_filename=document.original_filename,
        content_type=document.content_type,
    )


@router.get("/{document_id}/preview", response_model=None)
def preview_document(document_id: str, request: Request, db: DbSession, current_user: CurrentUser) -> Response:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    ip_address, user_agent = _client_metadata(request)
    append_audit_event(
        db,
        event_type="document.previewed",
        actor_user_id=current_user.id,
        entity_type="document",
        entity_id=document.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.commit()
    return secure_preview(
        storage_key=document.storage_key,
        original_filename=document.original_filename,
        content_type=document.content_type,
    )


@router.get("/{document_id}/verification-report", response_model=VerificationReportResponse)
def verification_report(document_id: str, db: DbSession, current_user: CurrentUser) -> VerificationReportResponse:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    if document.status != DocumentStatus.APPROVED or not document.reference_code:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A verification report is unavailable until approval.")
    from app.core.config import get_settings

    report_fields = {
        "reference_code": document.reference_code,
        "title": document.title,
        "document_hash": document.sha256,
        "status": document.status.value,
        "approved_at": document.approved_at.isoformat() if document.approved_at else None,
        "current_version": document.current_version,
    }
    signature = hmac.new(
        get_settings().jwt_secret_key.get_secret_value().encode("utf-8"),
        json.dumps(report_fields, sort_keys=True, separators=(",", ":")).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return VerificationReportResponse(
        reference_code=document.reference_code,
        title=document.title,
        document_hash=document.sha256,
        status=document.status,
        approved_at=document.approved_at,
        issued_at=document.created_at,
        current_version=document.current_version,
        verification_url=f"{get_settings().public_verification_base_url.rstrip('/')}/{document.reference_code}",
        signature=signature,
    )


@router.get("/{document_id}/verification-history", response_model=list[VerificationHistoryResponse])
def verification_history(document_id: str, db: DbSession, current_user: CurrentUser) -> list[VerificationHistoryResponse]:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    events = (
        db.query(VerificationEvent)
        .filter(VerificationEvent.document_id == document.id)
        .order_by(VerificationEvent.created_at.desc())
        .all()
    )
    return [
        VerificationHistoryResponse(
            id=event.id,
            reference_code=event.reference_code,
            outcome=event.outcome,
            is_public_request=event.is_public_request,
            created_at=event.created_at,
        )
        for event in events
    ]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(enforce_csrf)])
def delete_document(document_id: str, db: DbSession, current_user: CurrentUser) -> None:
    document = get_visible_document(db, document_id=document_id, actor=current_user)
    soft_delete_document(db, document=document, actor=current_user)
    db.commit()
