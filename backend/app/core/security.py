import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal
from uuid import uuid4

import bcrypt
import jwt
from fastapi import HTTPException, status

from app.core.config import get_settings

TokenType = Literal["access", "refresh", "email_verification", "password_reset"]


def utcnow() -> datetime:
    return datetime.now(UTC)


def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        raise ValueError("Password must be at most 72 UTF-8 bytes.")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        return False
    try:
        return bcrypt.checkpw(encoded, password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_opaque_token(value: str) -> str:
    """Persist opaque secrets only as a one-way digest."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generate_opaque_token() -> str:
    return secrets.token_urlsafe(48)


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def create_token(
    subject: str,
    token_type: TokenType,
    expires_delta: timedelta,
    role: str | None = None,
) -> tuple[str, str, datetime]:
    settings = get_settings()
    now = utcnow()
    expires_at = now + expires_delta
    token_id = str(uuid4())
    claims: dict[str, str | int] = {
        "sub": subject,
        "jti": token_id,
        "typ": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    if role is not None:
        claims["role"] = role
    token = jwt.encode(
        claims,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    return token, token_id, expires_at


def decode_token(token: str, expected_type: TokenType) -> dict[str, str | int]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub", "jti", "typ"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("typ") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is not valid for this operation.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def validate_password_policy(password: str) -> None:
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters.")
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be at most 72 UTF-8 bytes.")
    if not any(character.islower() for character in password):
        raise ValueError("Password must include a lowercase letter.")
    if not any(character.isupper() for character in password):
        raise ValueError("Password must include an uppercase letter.")
    if not any(character.isdigit() for character in password):
        raise ValueError("Password must include a number.")
    if not any(not character.isalnum() for character in password):
        raise ValueError("Password must include a symbol.")
