from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.core.security import (
    create_token,
    decode_token,
    hash_opaque_token,
    hash_password,
    validate_password_policy,
    verify_password,
)


def test_password_hash_is_not_the_password_and_verifies() -> None:
    password = "SecureDocs!2026"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("IncorrectPassword!2026", password_hash)


@pytest.mark.parametrize(
    "password",
    ["short1!A", "lowercaseonly!1", "UPPERCASEONLY!1", "NoNumber!Password", "NoSymbol123Password"],
)
def test_password_policy_rejects_weak_passwords(password: str) -> None:
    with pytest.raises(ValueError):
        validate_password_policy(password)


def test_access_token_can_only_be_used_as_access_token() -> None:
    token, _, _ = create_token("user-123", "access", timedelta(minutes=5), role="employee")
    payload = decode_token(token, "access")

    assert payload["sub"] == "user-123"
    assert payload["role"] == "employee"
    with pytest.raises(HTTPException) as error:
        decode_token(token, "refresh")
    assert error.value.status_code == 401


def test_opaque_token_digest_is_deterministic_and_non_reversible() -> None:
    token = "opaque-sensitive-token"
    assert hash_opaque_token(token) == hash_opaque_token(token)
    assert hash_opaque_token(token) != token
