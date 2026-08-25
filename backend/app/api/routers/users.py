from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select

from app.api.dependencies import AdminUser, CurrentUser, DbSession, enforce_csrf
from app.models.enums import UserRole
from app.models.security import AuditEvent
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.user import (
    PersonalActivityResponse,
    ProfileUpdateRequest,
    UserManagementResponse,
    UserRoleUpdateRequest,
)
from app.services.audit import append_audit_event
from app.services.storage import store_document, validate_upload_content

router = APIRouter(prefix="/users", tags=["Users and Roles"])


def _require_admin(user: User) -> None:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator permission is required.")


@router.patch("/me", response_model=UserResponse, dependencies=[Depends(enforce_csrf)])
def update_profile(payload: ProfileUpdateRequest, db: DbSession, current_user: CurrentUser) -> UserResponse:
    current_user.full_name = payload.full_name
    current_user.profile_image_key = payload.profile_image_key
    append_audit_event(
        db,
        event_type="profile.updated",
        actor_user_id=current_user.id,
        entity_type="user",
        entity_id=current_user.id,
    )
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/avatar", response_model=UserResponse, dependencies=[Depends(enforce_csrf)])
async def upload_profile_image(
    db: DbSession, current_user: CurrentUser, file: UploadFile = File(...)
) -> UserResponse:
    content = await file.read()
    content_type = validate_upload_content(file.filename or "profile-image", file.content_type or "", content)
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Profile images must be image files.")
    extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[content_type]
    storage_key = f"profile-images/{current_user.id}/{uuid4().hex}.{extension}"
    store_document(storage_key=storage_key, content=content, content_type=content_type)
    current_user.profile_image_key = storage_key
    append_audit_event(
        db,
        event_type="profile.image_uploaded",
        actor_user_id=current_user.id,
        entity_type="user",
        entity_id=current_user.id,
        metadata={"content_type": content_type, "size_bytes": len(content)},
    )
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/me/activity", response_model=list[PersonalActivityResponse])
def personal_activity(
    db: DbSession, current_user: CurrentUser, limit: int = Query(default=25, ge=1, le=100)
) -> list[PersonalActivityResponse]:
    events = db.scalars(
        select(AuditEvent)
        .where(AuditEvent.actor_user_id == current_user.id)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
    ).all()
    return [
        PersonalActivityResponse(
            id=event.id,
            event_type=event.event_type,
            outcome=event.outcome,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            created_at=event.created_at,
        )
        for event in events
    ]


@router.get("", response_model=list[UserManagementResponse])
def list_users(db: DbSession, current_user: AdminUser) -> list[UserManagementResponse]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [UserManagementResponse.model_validate(user) for user in users]


@router.patch("/{user_id}/role", response_model=UserManagementResponse, dependencies=[Depends(enforce_csrf)])
def update_user_role(
    user_id: str, payload: UserRoleUpdateRequest, db: DbSession, current_user: AdminUser
) -> UserManagementResponse:
    target_user = db.get(User, user_id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User was not found.")
    if target_user.id == current_user.id and payload.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Administrators cannot remove their own administrator role.")
    previous_role = target_user.role
    target_user.role = payload.role
    append_audit_event(
        db,
        event_type="permission.role_changed",
        actor_user_id=current_user.id,
        entity_type="user",
        entity_id=target_user.id,
        metadata={"previous_role": previous_role.value, "new_role": payload.role.value},
    )
    db.commit()
    db.refresh(target_user)
    return UserManagementResponse.model_validate(target_user)
