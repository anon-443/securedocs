from collections.abc import Callable
from typing import Annotated

from fastapi import Cookie, Depends, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db_session
from app.models.enums import UserRole
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)
DbSession = Annotated[Session, Depends(get_db_session)]


def _get_bearer_or_cookie_token(
    bearer_token: Annotated[str | None, Depends(oauth2_scheme)],
    access_cookie: Annotated[str | None, Cookie(alias="sd_access")] = None,
) -> str:
    token = bearer_token or access_cookie
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


def get_current_user(db: DbSession, token: Annotated[str, Depends(_get_bearer_or_cookie_token)]) -> User:
    payload = decode_token(token, "access")
    user = db.get(User, str(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is not active.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    def dependency(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not permitted to perform this action.")
        return user

    return dependency


AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
ManagerOrAdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))]


def enforce_csrf(
    request: Request,
    csrf_cookie: Annotated[str | None, Cookie(alias="sd_csrf")] = None,
    csrf_header: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> None:
    """Double-submit token defense for mutating endpoints authenticated by cookies."""

    if request.cookies.get("sd_access") and (
        not csrf_cookie or not csrf_header or csrf_cookie != csrf_header
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed.")
