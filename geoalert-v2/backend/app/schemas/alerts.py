from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator
import re


class BoundingBox(BaseModel):
    min_lon: float = Field(..., ge=-180, le=180)
    min_lat: float = Field(..., ge=-90, le=90)
    max_lon: float = Field(..., ge=-180, le=180)
    max_lat: float = Field(..., ge=-90, le=90)

    @field_validator('max_lon')
    @classmethod
    def max_lon_gt_min_lon(cls, v, info):
        if 'min_lon' in info.data and v <= info.data['min_lon']:
            raise ValueError('max_lon must be greater than min_lon')
        return v

    @field_validator('max_lat')
    @classmethod
    def max_lat_gt_min_lat(cls, v, info):
        if 'min_lat' in info.data and v <= info.data['min_lat']:
            raise ValueError('max_lat must be greater than min_lat')
        return v


class VerificationDetails(BaseModel):
    https_verified: bool
    domain_reputation: str
    dkim_verified: Optional[bool] = None
    listed_in_official_registry: bool
    registry_name: Optional[str] = None


class SourceProvenanceResponse(BaseModel):
    classification: str
    display_name: str
    url: str
    verification_details: VerificationDetails


class AlertMetadata(BaseModel):
    is_stale: bool
    age_minutes: float
    verification_level: str
    ingested_at: datetime


class AlertResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    external_id: str
    source_id: uuid.UUID
    severity: str
    event: str
    headline: str
    description: Optional[str] = None
    instruction: Optional[str] = None
    geometry: Any  # GeoJSON geometry dict
    effective: datetime
    expires: datetime
    onset: Optional[datetime] = None
    areas: List[str] = []
    source: Optional[SourceProvenanceResponse] = None
    metadata: Optional[AlertMetadata] = None


class AlertsMetadata(BaseModel):
    total: int
    returned: int
    timestamp: datetime
    stale_cutoff: datetime


class AlertsResponse(BaseModel):
    alerts: List[AlertResponse]
    metadata: AlertsMetadata


class AlertDetailResponse(BaseModel):
    alert: AlertResponse
    related_alerts: List[AlertResponse] = []
    metadata: dict


class AlertQueryParams(BaseModel):
    region: Optional[str] = None
    bbox: Optional[BoundingBox] = None
    severity: Optional[List[str]] = None
    source: Optional[str] = Field(None, pattern=r'^(official|community|all)$')
    limit: int = Field(50, ge=1, le=200)
    offset: int = Field(0, ge=0)
    include_expired: bool = False
