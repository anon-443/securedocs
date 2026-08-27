from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_has_security_headers() -> None:
    response = client.get("/health", headers={"host": "localhost"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "securedocs-api"}
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_configuration_health_exposes_only_safe_email_link_posture() -> None:
    response = client.get("/health/configuration", headers={"host": "localhost"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "email_verification_frontend_url" not in body
    assert "smtp_password" not in body
    assert isinstance(body["verification_link_uses_https"], bool)
    assert isinstance(body["verification_link_uses_localhost"], bool)


def test_registration_rejects_invalid_input_before_persistence() -> None:
    response = client.post(
        "/api/v1/auth/register",
        headers={"host": "localhost"},
        json={"email": "not-an-email", "full_name": "A", "password": "weak"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Request validation failed."
