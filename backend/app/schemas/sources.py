from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import bleach


class ClassifySourceRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)
    name: Optional[str] = Field(None, max_length=255)
    provided_classification: Optional[str] = Field(None, pattern=r'^(official|community)$')

    @field_validator('url')
    @classmethod
    def sanitize_url(cls, v: str) -> str:
        cleaned = bleach.clean(v, tags=[], strip=True)
        return cleaned.strip()

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()


class VerificationDetailsResponse(BaseModel):
    https_verified: bool
    domain_reputation: str
    listed_in_official_registry: bool
    registry_name: Optional[str] = None
    manual_review_required: bool


class ClassifySourceResponse(BaseModel):
    classification: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    verification_details: VerificationDetailsResponse
    reasoning: List[str]


class SourceResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    url: str
    classification: str
    verification_level: str
    status: str
    last_ingested_at: Optional[datetime] = None
    error_rate: float
    metadata: Optional[dict] = None


class SourcesMetadata(BaseModel):
    total: int
    official_count: int
    community_count: int


class SourcesResponse(BaseModel):
    sources: List[SourceResponse]
    metadata: SourcesMetadata
