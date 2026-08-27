from types import SimpleNamespace

from pydantic import SecretStr

from app.services import storage


class StubResponse:
    def __init__(self, payload: dict[str, str] | None = None, content: bytes = b"") -> None:
        self.payload = payload or {}
        self.content = content

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, str]:
        return self.payload


def _managed_settings() -> SimpleNamespace:
    return SimpleNamespace(
        storage_backend="managed",
        managed_storage_api_url="https://forge.example.test/",
        managed_storage_api_key=SecretStr("managed-test-token"),
    )


def test_managed_storage_upload_uses_project_presign_endpoint(monkeypatch) -> None:
    requests: list[tuple[str, object]] = []
    monkeypatch.setattr(storage, "settings", _managed_settings())
    monkeypatch.setattr(
        storage.httpx,
        "get",
        lambda url, **kwargs: requests.append((url, kwargs)) or StubResponse({"url": "https://upload.example.test/object"}),
    )
    monkeypatch.setattr(
        storage.httpx,
        "put",
        lambda url, **kwargs: requests.append((url, kwargs)) or StubResponse(),
    )

    storage.store_document(
        storage_key="documents/user/document.pdf",
        content=b"%PDF-test",
        content_type="application/pdf",
    )

    assert requests[0][0] == "https://forge.example.test/v1/storage/presign/put"
    assert requests[0][1]["params"] == {"path": "documents/user/document.pdf"}
    assert requests[1][0] == "https://upload.example.test/object"
    assert requests[1][1]["headers"] == {"Content-Type": "application/pdf"}


def test_managed_secure_download_preserves_forced_download_filename(monkeypatch) -> None:
    monkeypatch.setattr(storage, "settings", _managed_settings())
    monkeypatch.setattr(
        storage.httpx,
        "get",
        lambda url, **kwargs: (
            StubResponse({"url": "https://download.example.test/signed"})
            if "presign" in url
            else StubResponse(content=b"private PDF bytes")
        ),
    )

    response = storage.secure_download(
        storage_key="documents/user/document.pdf",
        original_filename="approved document.pdf",
        content_type="application/pdf",
    )

    assert response.status_code == 200
    assert response.body == b"private PDF bytes"
    assert response.headers["content-disposition"] == 'attachment; filename="approved document.pdf"'
    assert response.headers["cache-control"] == "private, no-store"


def test_managed_secure_preview_preserves_inline_preview_filename(monkeypatch) -> None:
    monkeypatch.setattr(storage, "settings", _managed_settings())
    monkeypatch.setattr(storage, "_managed_document_bytes", lambda **kwargs: b"private PNG bytes")

    response = storage.secure_preview(
        storage_key="documents/user/document.png",
        original_filename="reviewed image.png",
        content_type="image/png",
    )

    assert response.status_code == 200
    assert response.body == b"private PNG bytes"
    assert response.headers["content-disposition"] == 'inline; filename="reviewed image.png"'
    assert response.headers["cache-control"] == "private, no-store"
