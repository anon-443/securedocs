from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import CurrentUser, DbSession, enforce_csrf
from app.core.config import get_settings
from app.core.security import utcnow, verify_password
from app.models.enums import AlertSeverity
from app.schemas.auth import (
    AuthSessionResponse,
    LoginRequest,
    MessageResponse,
    PasswordChangeRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RegistrationRequest,
    TokenVerificationRequest,
    UserResponse,
)
from app.services.audit import append_audit_event
from app.services.auth import (
    authenticate_user,
    consume_one_time_token,
    get_user_by_email,
    issue_one_time_token,
    issue_session,
    register_user,
    revoke_all_refresh_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
)
from app.services.email import send_password_reset_email, send_verification_email
from app.services.security_alerts import create_security_alert

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


def _client_metadata(request: Request) -> tuple[str | None, str | None]:
    return request.client.host if request.client else None, request.headers.get("user-agent")


def _set_session_cookies(response: Response, access: str, refresh: str, csrf: str) -> None:
    settings = get_settings()
    shared = {
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "domain": settings.cookie_domain,
    }
    response.set_cookie(
        key="sd_access",
        value=access,
        max_age=settings.access_token_expire_minutes * 60,
        httponly=True,
        path="/",
        **shared,
    )
    response.set_cookie(
        key="sd_refresh",
        value=refresh,
        max_age=settings.refresh_token_expire_days * 86_400,
        httponly=True,
        path="/api/v1/auth",
        **shared,
    )
    response.set_cookie(
        key="sd_csrf",
        value=csrf,
        max_age=settings.refresh_token_expire_days * 86_400,
        httponly=False,
        path="/",
        **shared,
    )


def _clear_session_cookies(response: Response) -> None:
    settings = get_settings()
    for key, path in (("sd_access", "/"), ("sd_refresh", "/api/v1/auth"), ("sd_csrf", "/")):
        response.delete_cookie(key=key, path=path, domain=settings.cookie_domain)


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegistrationRequest, db: DbSession) -> MessageResponse:
    user = register_user(db, email=str(payload.email), full_name=payload.full_name, password=payload.password)
    verification_token = issue_one_time_token(db, user=user, purpose="email_verification")
    ip_address, user_agent = _client_metadata(request)
    append_audit_event(
        db,
        event_type="auth.registration",
        actor_user_id=user.id,
        entity_type="user",
        entity_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.commit()
    send_verification_email(recipient=user.email, token=verification_token)
    return MessageResponse(message="Registration received. Check your email to verify the account.")


@router.post("/login", response_model=AuthSessionResponse)
@limiter.limit("5/minute")
def login(request: Request, response: Response, payload: LoginRequest, db: DbSession) -> AuthSessionResponse:
    user = authenticate_user(db, email=str(payload.email), password=payload.password)
    ip_address, user_agent = _client_metadata(request)
    if user is None:
        candidate = get_user_by_email(db, str(payload.email))
        append_audit_event(
            db,
            event_type="auth.login",
            actor_user_id=candidate.id if candidate else None,
            entity_type="user",
            entity_id=candidate.id if candidate else None,
            outcome="failure",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"reason": "invalid_credentials"},
        )
        if candidate:
            candidate.failed_login_count += 1
            if candidate.failed_login_count >= 5:
                create_security_alert(
                    db,
                    severity=AlertSeverity.HIGH,
                    title="Repeated failed sign-in attempts",
                    description=(
                        "Five or more failed sign-in attempts were recorded for this account. "
                        "Review account activity and lockout policy."
                    ),
                    user_id=candidate.id,
                )
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if user.email_verified_at is None:
        append_audit_event(
            db,
            event_type="auth.login",
            actor_user_id=user.id,
            entity_type="user",
            entity_id=user.id,
            outcome="failure",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"reason": "email_not_verified"},
        )
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verify your email address before signing in.")
    access, refresh, csrf = issue_session(db, user=user, ip_address=ip_address, user_agent=user_agent)
    append_audit_event(
        db,
        event_type="auth.login",
        actor_user_id=user.id,
        entity_type="user",
        entity_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.commit()
    _set_session_cookies(response, access, refresh, csrf)
    return AuthSessionResponse(user=UserResponse.model_validate(user), csrf_token=csrf)


@router.post("/refresh", response_model=AuthSessionResponse, dependencies=[Depends(enforce_csrf)])
def refresh(
    request: Request,
    response: Response,
    db: DbSession,
    refresh_cookie: Annotated[str | None, Cookie(alias="sd_refresh")] = None,
) -> AuthSessionResponse:
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh session is required.")
    ip_address, user_agent = _client_metadata(request)
    user, access, refresh_token, csrf = rotate_refresh_token(
        db, refresh_token=refresh_cookie, ip_address=ip_address, user_agent=user_agent
    )
    append_audit_event(db, event_type="auth.token_refresh", actor_user_id=user.id, entity_type="user", entity_id=user.id)
    db.commit()
    _set_session_cookies(response, access, refresh_token, csrf)
    return AuthSessionResponse(user=UserResponse.model_validate(user), csrf_token=csrf)


@router.post("/logout", response_model=MessageResponse, dependencies=[Depends(enforce_csrf)])
def logout(request: Request, response: Response, current_user: CurrentUser, db: DbSession) -> MessageResponse:
    revoke_refresh_token(db, request.cookies.get("sd_refresh", ""))
    append_audit_event(db, event_type="auth.logout", actor_user_id=current_user.id, entity_type="user", entity_id=current_user.id)
    db.commit()
    _clear_session_cookies(response)
    return MessageResponse(message="You have been signed out.")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: TokenVerificationRequest, db: DbSession) -> MessageResponse:
    user = consume_one_time_token(db, token=payload.token, purpose="email_verification")
    user.email_verified_at = utcnow()
    append_audit_event(db, event_type="auth.email_verified", actor_user_id=user.id, entity_type="user", entity_id=user.id)
    db.commit()
    return MessageResponse(message="Your email has been verified.")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: PasswordResetRequest, db: DbSession) -> MessageResponse:
    user = get_user_by_email(db, str(payload.email))
    if user and user.is_active:
        reset_token = issue_one_time_token(db, user=user, purpose="password_reset")
        append_audit_event(db, event_type="auth.password_reset_requested", actor_user_id=user.id, entity_type="user", entity_id=user.id)
        db.commit()
        send_password_reset_email(recipient=user.email, token=reset_token)
    return MessageResponse(message="If that account exists, password-reset instructions have been sent.")


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("3/minute")
def resend_verification(request: Request, payload: PasswordResetRequest, db: DbSession) -> MessageResponse:
    user = get_user_by_email(db, str(payload.email))
    if user and user.is_active and user.email_verified_at is None:
        verification_token = issue_one_time_token(db, user=user, purpose="email_verification")
        append_audit_event(db, event_type="auth.email_verification_resent", actor_user_id=user.id, entity_type="user", entity_id=user.id)
        db.commit()
        send_verification_email(recipient=user.email, token=verification_token)
    return MessageResponse(message="If verification is required for that account, a new link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: PasswordResetConfirmRequest, db: DbSession) -> MessageResponse:
    user = consume_one_time_token(db, token=payload.token, purpose="password_reset")
    from app.core.security import hash_password

    user.password_hash = hash_password(payload.new_password)
    revoke_all_refresh_tokens(db, user.id)
    append_audit_event(db, event_type="auth.password_reset_completed", actor_user_id=user.id, entity_type="user", entity_id=user.id)
    db.commit()
    return MessageResponse(message="Your password has been updated. Please sign in again.")


@router.post("/change-password", response_model=MessageResponse, dependencies=[Depends(enforce_csrf)])
def change_password(payload: PasswordChangeRequest, current_user: CurrentUser, db: DbSession) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    from app.core.security import hash_password

    current_user.password_hash = hash_password(payload.new_password)
    revoke_all_refresh_tokens(db, current_user.id)
    append_audit_event(
        db,
        event_type="auth.password_changed",
        actor_user_id=current_user.id,
        entity_type="user",
        entity_id=current_user.id,
    )
    db.commit()
    return MessageResponse(message="Your password has been changed. Please sign in again.")


@router.get("/me", response_model=UserResponse)
def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
