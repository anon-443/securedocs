from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_token,
    decode_token,
    generate_opaque_token,
    hash_opaque_token,
    hash_password,
    utcnow,
    verify_password,
)
from app.models.enums import UserRole
from app.models.user import EmailVerificationToken, PasswordResetToken, RefreshToken, User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def register_user(db: Session, *, email: str, full_name: str, password: str) -> User:
    normalized_email = normalize_email(email)
    if get_user_by_email(db, normalized_email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email.")
    user = User(
        email=normalized_email,
        full_name=full_name,
        password_hash=hash_password(password),
        role=UserRole.EMPLOYEE,
    )
    db.add(user)
    db.flush()
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    if user.locked_until and user.locked_until > utcnow():
        return None
    return user


def issue_session(db: Session, *, user: User, ip_address: str | None, user_agent: str | None) -> tuple[str, str, str]:
    settings = get_settings()
    access_token, _, _ = create_token(
        subject=user.id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        role=user.role.value,
    )
    refresh_token, refresh_jti, refresh_expires_at = create_token(
        subject=user.id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        role=user.role.value,
    )
    db.add(
        RefreshToken(
            user_id=user.id,
            token_id=refresh_jti,
            token_hash=hash_opaque_token(refresh_token),
            expires_at=refresh_expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )
    user.last_login_at = utcnow()
    user.failed_login_count = 0
    return access_token, refresh_token, generate_opaque_token()


def rotate_refresh_token(
    db: Session, *, refresh_token: str, ip_address: str | None, user_agent: str | None
) -> tuple[User, str, str, str]:
    payload = decode_token(refresh_token, "refresh")
    token_id = str(payload["jti"])
    token_hash = hash_opaque_token(refresh_token)
    stored = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_id == token_id,
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
    )
    if stored is None or stored.expires_at <= utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session is invalid or expired.")
    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session is not authorized.")
    stored.revoked_at = utcnow()
    access, refresh, csrf = issue_session(db, user=user, ip_address=ip_address, user_agent=user_agent)
    return user, access, refresh, csrf


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, "refresh")
    except HTTPException:
        return
    stored = db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_id == str(payload["jti"]),
            RefreshToken.token_hash == hash_opaque_token(refresh_token),
        )
    )
    if stored and stored.revoked_at is None:
        stored.revoked_at = utcnow()


def issue_one_time_token(db: Session, *, user: User, purpose: str) -> str:
    settings = get_settings()
    token = generate_opaque_token()
    token_hash = hash_opaque_token(token)
    if purpose == "email_verification":
        db.add(
            EmailVerificationToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=utcnow() + timedelta(hours=settings.email_verification_expire_hours),
            )
        )
    elif purpose == "password_reset":
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=utcnow() + timedelta(minutes=settings.password_reset_expire_minutes),
            )
        )
    else:
        raise ValueError("Unsupported one-time-token purpose.")
    return token


def consume_one_time_token(db: Session, *, token: str, purpose: str) -> User:
    token_hash = hash_opaque_token(token)
    model = EmailVerificationToken if purpose == "email_verification" else PasswordResetToken
    record = db.scalar(select(model).where(model.token_hash == token_hash, model.used_at.is_(None)))
    if record is None or record.expires_at <= utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This link is invalid or expired.")
    user = db.get(User, record.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This link is invalid or expired.")
    record.used_at = utcnow()
    return user


def revoke_all_refresh_tokens(db: Session, user_id: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )
