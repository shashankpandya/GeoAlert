from __future__ import annotations
from typing import List, Any
from pydantic import BaseModel, Field
import bleach


class RawAlertData(BaseModel):
    external_id: str = Field(..., min_length=1, max_length=255)
    format: str = Field(..., pattern=r'^(cap|geojson|custom)$')
    payload: Any

    @classmethod
    def validate_external_id(cls, v: str) -> str:
        return bleach.clean(v, tags=[], strip=True).strip()


class IngestAlertsRequest(BaseModel):
    source_id: str = Field(..., min_length=36, max_length=36)
    alerts: List[RawAlertData] = Field(..., min_length=1, max_length=1000)


class IngestionTiming(BaseModel):
    total_ms: int
    validation_ms: int
    classification_ms: int
    storage_ms: int


class IngestionError(BaseModel):
    alert_id: str
    error: str


class IngestAlertsResponse(BaseModel):
    ingested: int
    updated: int
    skipped: int
    errors: List[IngestionError] = []
    timing: IngestionTiming
