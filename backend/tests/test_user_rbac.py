from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.routers.users import _require_admin
from app.models.enums import UserRole


def test_administrator_guard_allows_administrators() -> None:
    _require_admin(SimpleNamespace(role=UserRole.ADMIN))


@pytest.mark.parametrize("role", [UserRole.MANAGER, UserRole.EMPLOYEE])
def test_administrator_guard_rejects_non_administrators(role: UserRole) -> None:
    with pytest.raises(HTTPException) as error:
        _require_admin(SimpleNamespace(role=role))
    assert error.value.status_code == 403
