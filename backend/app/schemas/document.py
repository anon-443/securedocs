from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DocumentStatus, ReviewDecision


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None
    created_at: datetime


class DocumentUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category_id: str | None = None


class DocumentReviewRequest(BaseModel):
    decision: ReviewDecision
    note: str | None = Field(default=None, max_length=5000)


class DocumentResponse(BaseModel):
    id: str
    title: str
    description: str | None
    original_filename: str
    content_type: str
    size_bytes: int
    sha256: str
    status: DocumentStatus
    reference_code: str | None
    owner_user_id: str
    category_id: str | None
    category_name: str | None
    current_version: int
    reviewed_by_user_id: str | None
    reviewed_at: datetime | None
    review_note: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class VerificationReportResponse(BaseModel):
    reference_code: str
    title: str
    document_hash: str
    status: DocumentStatus
    approved_at: datetime | None
    issued_at: datetime
    current_version: int
    verification_url: str
    signature: str


class VerificationHistoryResponse(BaseModel):
    id: str
    reference_code: str
    outcome: str
    is_public_request: bool
    created_at: datetime
