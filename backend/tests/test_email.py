import logging
from types import SimpleNamespace

import pytest

from app.services import email


def test_verification_delivery_logs_only_in_development(monkeypatch, caplog) -> None:
    settings = SimpleNamespace(
        app_env="development",
        smtp_host=None,
        email_verification_frontend_url="http://localhost:5173/verify-email",
    )
    monkeypatch.setattr(email, "get_settings", lambda: settings)
    caplog.set_level(logging.INFO, logger="securedocs.email")

    email.send_verification_email(recipient="ade@example.com", token="verification-token")

    assert "Development email for ade@example.com" in caplog.text


def test_production_email_fails_closed_without_smtp(monkeypatch) -> None:
    settings = SimpleNamespace(app_env="production", smtp_host=None)
    monkeypatch.setattr(email, "get_settings", lambda: settings)

    with pytest.raises(RuntimeError, match="SMTP must be configured"):
        email._deliver(recipient="ade@example.com", subject="SecureDocs", plain_text="content")
