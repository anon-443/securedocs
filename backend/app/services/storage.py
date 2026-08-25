import io
import os
import zipfile
from pathlib import Path
from uuid import uuid4

import boto3
from fastapi import HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse, Response

from app.core.config import get_settings

settings = get_settings()
LOCAL_STORAGE_ROOT = Path("storage/local").resolve()


def safe_original_filename(value: str) -> str:
    """Keep a display filename while removing path components and control characters."""
    cleaned = Path(value).name.replace("\x00", "").strip()
    if not cleaned or len(cleaned) > 255:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file name.")
    return cleaned


def _validate_docx(data: bytes) -> bool:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            names = set(archive.namelist())
            return "[Content_Types].xml" in names and any(name.startswith("word/") for name in names)
    except zipfile.BadZipFile:
        return False


def validate_upload_content(filename: str, content_type: str, data: bytes) -> str:
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="The uploaded file is too large.")
    filename = safe_original_filename(filename)
    detected: str | None = None
    if data.startswith(b"%PDF-"):
        detected = "application/pdf"
    elif data.startswith(b"\xff\xd8\xff"):
        detected = "image/jpeg"
    elif data.startswith(b"\x89PNG\r\n\x1a\n"):
        detected = "image/png"
    elif data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        detected = "image/webp"
    elif data.startswith(b"PK\x03\x04") and _validate_docx(data):
        detected = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    if detected is None or detected not in settings.allowed_content_types:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported or invalid file content.")
    if content_type and content_type != detected:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File content does not match its declared type.")
    return detected


def generate_document_storage_key(owner_user_id: str, content_type: str) -> str:
    extension_by_type = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    return f"documents/{owner_user_id}/{uuid4().hex}.{extension_by_type[content_type]}"


def _local_path(storage_key: str) -> Path:
    candidate = (LOCAL_STORAGE_ROOT / storage_key).resolve()
    if LOCAL_STORAGE_ROOT not in candidate.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document storage key.")
    return candidate


def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.storage_region,
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id.get_secret_value() if settings.s3_access_key_id else None,
        aws_secret_access_key=settings.s3_secret_access_key.get_secret_value() if settings.s3_secret_access_key else None,
    )


def store_document(*, storage_key: str, content: bytes, content_type: str) -> None:
    if settings.storage_backend == "s3":
        _s3_client().put_object(
            Bucket=settings.storage_bucket,
            Key=storage_key,
            Body=content,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )
        return
    path = _local_path(storage_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(f"{path.suffix}.uploading")
    temporary_path.write_bytes(content)
    os.replace(temporary_path, path)


def secure_download(*, storage_key: str, original_filename: str, content_type: str) -> Response:
    filename = safe_original_filename(original_filename)
    if settings.storage_backend == "s3":
        url = _s3_client().generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.storage_bucket,
                "Key": storage_key,
                "ResponseContentType": content_type,
                "ResponseContentDisposition": f'attachment; filename="{filename}"',
            },
            ExpiresIn=300,
        )
        return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    path = _local_path(storage_key)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document content is unavailable.")
    return FileResponse(path, media_type=content_type, filename=filename, headers={"Cache-Control": "private, no-store"})


def secure_preview(*, storage_key: str, original_filename: str, content_type: str) -> Response:
    """Serve only browser-safe preview types after the document API authorizes the request."""

    if content_type not in {"application/pdf", "image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="This document type does not support browser preview. Download it securely instead.",
        )
    filename = safe_original_filename(original_filename)
    if settings.storage_backend == "s3":
        url = _s3_client().generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.storage_bucket,
                "Key": storage_key,
                "ResponseContentType": content_type,
                "ResponseContentDisposition": f'inline; filename="{filename}"',
            },
            ExpiresIn=120,
        )
        return RedirectResponse(url=url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    path = _local_path(storage_key)
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document content is unavailable.")
    return FileResponse(
        path,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"', "Cache-Control": "private, no-store"},
    )
