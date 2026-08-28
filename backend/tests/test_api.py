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


def test_configuration_health_is_not_exposed_after_deployment_diagnostics() -> None:
    response = client.get("/health/configuration", headers={"host": "localhost"})

    assert response.status_code == 404


def test_registration_rejects_invalid_input_before_persistence() -> None:
    response = client.post(
        "/api/v1/auth/register",
        headers={"host": "localhost"},
        json={"email": "not-an-email", "full_name": "A", "password": "weak"},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Request validation failed."
