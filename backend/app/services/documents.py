import hashlib
import secrets
from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.document import Category, Document, DocumentReview, DocumentVersion
from app.models.enums import DocumentStatus, ReviewDecision, UserRole
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentUpdateRequest
from app.services.audit import append_audit_event
from app.services.storage import generate_document_storage_key, safe_original_filename, store_document, validate_upload_content


def utcnow() -> datetime:
    return datetime.now(UTC)


def _document_response(document: Document, category_name: str | None = None) -> DocumentResponse:
    return DocumentResponse(
        id=document.id,
        title=document.title,
        description=document.description,
        original_filename=document.original_filename,
        content_type=document.content_type,
        size_bytes=document.size_bytes,
        sha256=document.sha256,
        status=document.status,
        reference_code=document.reference_code,
        owner_user_id=document.owner_user_id,
        category_id=document.category_id,
        category_name=category_name,
        current_version=document.current_version,
        reviewed_by_user_id=document.reviewed_by_user_id,
        reviewed_at=document.reviewed_at,
        review_note=document.review_note,
        approved_at=document.approved_at,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def get_visible_document(db: Session, *, document_id: str, actor: User) -> Document:
    document = db.get(Document, document_id)
    if document is None or document.status == DocumentStatus.DELETED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document was not found.")
    if actor.role == UserRole.ADMIN:
        return document
    if actor.role == UserRole.MANAGER:
        return document
    if document.owner_user_id == actor.id:
        return document
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not permitted to access this document.")


def list_visible_documents(
    db: Session,
    *,
    actor: User,
    search: str | None = None,
    category_id: str | None = None,
    status_filter: DocumentStatus | None = None,
) -> list[DocumentResponse]:
    statement = select(Document, Category.name).outerjoin(Category, Category.id == Document.category_id)
    statement = statement.where(Document.status != DocumentStatus.DELETED)
    if actor.role == UserRole.EMPLOYEE:
        statement = statement.where(Document.owner_user_id == actor.id)
    if search:
        needle = f"%{search.strip()}%"
        statement = statement.where(or_(Document.title.ilike(needle), Document.original_filename.ilike(needle)))
    if category_id:
        statement = statement.where(Document.category_id == category_id)
    if status_filter:
        statement = statement.where(Document.status == status_filter)
    statement = statement.order_by(Document.updated_at.desc())
    return [_document_response(document, category_name) for document, category_name in db.execute(statement).all()]


async def create_document(
    db: Session,
    *,
    actor: User,
    file: UploadFile,
    title: str,
    description: str | None,
    category_id: str | None,
    ip_address: str | None,
    user_agent: str | None,
) -> DocumentResponse:
    normalized_title = " ".join(title.split())
    if len(normalized_title) < 2 or len(normalized_title) > 200:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Document title is invalid.")
    original_filename = safe_original_filename(file.filename or "")
    content = await file.read()
    detected_type = validate_upload_content(original_filename, file.content_type or "", content)
    if category_id and db.get(Category, category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document category was not found.")
    storage_key = generate_document_storage_key(actor.id, detected_type)
    store_document(storage_key=storage_key, content=content, content_type=detected_type)
    document = Document(
        owner_user_id=actor.id,
        category_id=category_id,
        title=normalized_title,
        description=description.strip() if description else None,
        original_filename=original_filename,
        storage_key=storage_key,
        content_type=detected_type,
        size_bytes=len(content),
        sha256=hashlib.sha256(content).hexdigest(),
        status=DocumentStatus.PENDING_REVIEW,
    )
    db.add(document)
    db.flush()
    db.add(
        DocumentVersion(
            document_id=document.id,
            version_number=1,
            storage_key=storage_key,
            original_filename=original_filename,
            content_type=detected_type,
            size_bytes=len(content),
            sha256=document.sha256,
            changed_by_user_id=actor.id,
        )
    )
    append_audit_event(
        db,
        event_type="document.uploaded",
        actor_user_id=actor.id,
        entity_type="document",
        entity_id=document.id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={"content_type": detected_type, "size_bytes": len(content), "sha256": document.sha256},
    )
    return _document_response(document)


def update_document(
    db: Session, *, document: Document, actor: User, changes: DocumentUpdateRequest
) -> DocumentResponse:
    if actor.role == UserRole.EMPLOYEE and (
        document.owner_user_id != actor.id or document.status not in {DocumentStatus.DRAFT, DocumentStatus.REJECTED}
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This document can no longer be edited by its owner.")
    if changes.title is not None:
        document.title = " ".join(changes.title.split())
    if changes.description is not None:
        document.description = changes.description.strip() or None
    if changes.category_id is not None:
        if db.get(Category, changes.category_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document category was not found.")
        document.category_id = changes.category_id
    append_audit_event(db, event_type="document.updated", actor_user_id=actor.id, entity_type="document", entity_id=document.id)
    return _document_response(document)


def review_document(
    db: Session, *, document: Document, actor: User, decision: ReviewDecision, note: str | None
) -> DocumentResponse:
    if actor.role not in {UserRole.ADMIN, UserRole.MANAGER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only a manager or administrator can review documents.")
    if document.status != DocumentStatus.PENDING_REVIEW:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only documents awaiting review can be decided.")
    now = utcnow()
    document.reviewed_by_user_id = actor.id
    document.reviewed_at = now
    document.review_note = note.strip() if note else None
    document.status = DocumentStatus.APPROVED if decision == ReviewDecision.APPROVED else DocumentStatus.REJECTED
    if decision == ReviewDecision.APPROVED:
        document.reference_code = f"SD-{now.year}-{secrets.token_hex(5).upper()}"
        document.approved_at = now
    db.add(DocumentReview(document_id=document.id, manager_user_id=actor.id, decision=decision, note=document.review_note))
    append_audit_event(
        db,
        event_type="document.reviewed",
        actor_user_id=actor.id,
        entity_type="document",
        entity_id=document.id,
        metadata={"decision": decision.value, "reference_code": document.reference_code},
    )
    return _document_response(document)


def soft_delete_document(db: Session, *, document: Document, actor: User) -> None:
    if actor.role != UserRole.ADMIN:
        if document.owner_user_id != actor.id or document.status == DocumentStatus.APPROVED:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not permitted to delete this document.")
    document.status = DocumentStatus.DELETED
    document.deleted_at = utcnow()
    append_audit_event(db, event_type="document.deleted", actor_user_id=actor.id, entity_type="document", entity_id=document.id)
