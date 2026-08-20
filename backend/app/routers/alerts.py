from __future__ import annotations
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Alert, Source, AlertArea
from app.schemas.alerts import (
    AlertsResponse,
    AlertResponse,
    AlertsMetadata,
    AlertMetadata,
    SourceProvenanceResponse,
    VerificationDetails,
)
import logging

router = APIRouter(prefix="/api/alerts", tags=["alerts"])
logger = logging.getLogger(__name__)

STALE_THRESHOLD_MINUTES = 120


def _build_source_response(source: Source) -> SourceProvenanceResponse:
    """Build a SourceProvenanceResponse from a Source ORM object."""
    return SourceProvenanceResponse(
        classification=source.classification,
        display_name=source.name,
        url=source.url,
        verification_details=VerificationDetails(
            https_verified=source.https_verified,
            domain_reputation=source.domain_reputation or "low",
            listed_in_official_registry=source.listed_in_registry,
            registry_name=source.registry_name,
        ),
    )


def _determine_verification_level(source: Source) -> str:
    """Derive a verification_level string from source fields."""
    if source.listed_in_registry and source.https_verified:
        return "verified"
    if source.domain_reputation == "low":
        return "suspicious"
    return "unverified"


def _alert_to_response(
    alert: Alert,
    geom: dict,
    areas: List[str],
) -> AlertResponse:
    """Convert an Alert ORM object to an AlertResponse, given pre-fetched geometry and areas."""
    now = datetime.now(timezone.utc)

    effective = (
        alert.effective.replace(tzinfo=timezone.utc)
        if alert.effective.tzinfo is None
        else alert.effective
    )
    age_minutes = (now - effective).total_seconds() / 60
    is_stale = age_minutes >= STALE_THRESHOLD_MINUTES

    source_resp: Optional[SourceProvenanceResponse] = None
    verification_level = "unverified"
    if alert.source:
        verification_level = _determine_verification_level(alert.source)
        source_resp = _build_source_response(alert.source)

    return AlertResponse(
        id=alert.id,
        external_id=alert.external_id,
        source_id=alert.source_id,
        severity=alert.severity,
        event=alert.event,
        headline=alert.headline,
        description=alert.description,
        instruction=alert.instruction,
        geometry=geom,
        effective=alert.effective,
        expires=alert.expires,
        onset=alert.onset,
        areas=areas,
        source=source_resp,
        metadata=AlertMetadata(
            is_stale=is_stale,
            age_minutes=age_minutes,
            verification_level=verification_level,
            ingested_at=alert.ingested_at,
        ),
    )


@router.get("", response_model=AlertsResponse)
async def get_alerts(
    region: Optional[str] = Query(None, description="Named region filter (reserved for future use)"),
    min_lon: Optional[float] = Query(None, ge=-180, le=180),
    min_lat: Optional[float] = Query(None, ge=-90, le=90),
    max_lon: Optional[float] = Query(None, ge=-180, le=180),
    max_lat: Optional[float] = Query(None, ge=-90, le=90),
    severity: Optional[List[str]] = Query(None),
    source: Optional[str] = Query(None, pattern=r"^(official|community|all)$"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    include_expired: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> AlertsResponse:
    """
    Retrieve active alerts with optional spatial and attribute filtering.

    - **bbox** (min_lon/min_lat/max_lon/max_lat): PostGIS ST_Intersects bounding-box filter.
    - **severity**: one or more of extreme|severe|moderate|minor.
    - **source**: official|community|all (default all).
    - **include_expired**: include alerts past their `expires` timestamp.
    """
    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(minutes=STALE_THRESHOLD_MINUTES)

    # Base query â€” eagerly load source so _alert_to_response can access it
    stmt = (
        select(Alert)
        .join(Alert.source)
        .options(selectinload(Alert.source))
    )

    # --- Expiry filter ---
    if not include_expired:
        stmt = stmt.where(Alert.expires > now)

    # --- Bounding-box spatial filter (PostGIS) ---
    bbox_provided = all(v is not None for v in [min_lon, min_lat, max_lon, max_lat])
    if bbox_provided:
        # Validate ordering
        if max_lon <= min_lon:  # type: ignore[operator]
            raise HTTPException(status_code=422, detail="max_lon must be greater than min_lon")
        if max_lat <= min_lat:  # type: ignore[operator]
            raise HTTPException(status_code=422, detail="max_lat must be greater than min_lat")

        bbox_wkt = (
            f"POLYGON(({min_lon} {min_lat},"
            f"{max_lon} {min_lat},"
            f"{max_lon} {max_lat},"
            f"{min_lon} {max_lat},"
            f"{min_lon} {min_lat}))"
        )
        bbox_geom = func.ST_GeomFromText(bbox_wkt, 4326)
        stmt = stmt.where(func.ST_Intersects(Alert.geometry, bbox_geom))

    # --- Severity filter ---
    if severity:
        valid_severities = {"extreme", "severe", "moderate", "minor"}
        filtered = [s.lower() for s in severity if s.lower() in valid_severities]
        if filtered:
            stmt = stmt.where(Alert.severity.in_(filtered))

    # --- Source classification filter ---
    if source and source != "all":
        stmt = stmt.where(Source.classification == source)

    # --- Count total matching rows (before pagination) ---
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total: int = total_result.scalar() or 0

    # --- Paginate and fetch alert rows ---
    stmt = stmt.order_by(Alert.effective.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    if not alerts:
        return AlertsResponse(
            alerts=[],
            metadata=AlertsMetadata(
                total=total,
                returned=0,
                timestamp=now,
                stale_cutoff=stale_cutoff,
            ),
        )

    # --- Fetch GeoJSON geometries via PostGIS ST_AsGeoJSON ---
    alert_ids_str = [str(a.id) for a in alerts]
    geom_result = await db.execute(
        text("SELECT id::text, ST_AsGeoJSON(geometry) FROM alerts WHERE id = ANY(:ids)"),
        {"ids": alert_ids_str},
    )
    geom_map: dict[str, dict] = {
        row[0]: json.loads(row[1]) for row in geom_result if row[1]
    }

    # --- Fetch AlertArea rows for these alerts ---
    areas_result = await db.execute(
        select(AlertArea)
        .where(AlertArea.alert_id.in_([a.id for a in alerts]))
        .order_by(AlertArea.alert_id, AlertArea.sort_order)
    )
    areas_by_alert: dict[str, List[str]] = {}
    for area in areas_result.scalars():
        areas_by_alert.setdefault(str(area.alert_id), []).append(area.area_description)

    # --- Assemble responses ---
    responses = [
        _alert_to_response(
            alert=a,
            geom=geom_map.get(str(a.id), {}),
            areas=areas_by_alert.get(str(a.id), []),
        )
        for a in alerts
    ]

    return AlertsResponse(
        alerts=responses,
        metadata=AlertsMetadata(
            total=total,
            returned=len(responses),
            timestamp=now,
            stale_cutoff=stale_cutoff,
        ),
    )


@router.post("/ingest", status_code=202)
async def ingest_alerts(
    request: dict,
    x_api_key: str = Header(..., alias="X-API-Key"),
):
    from app.config import settings
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Invalid API key"})
    source_id = request.get("sourceId") or request.get("source_id")
    alerts_data = request.get("alerts", [])
    if not source_id:
        raise HTTPException(status_code=422,
            detail={"code": "VALIDATION_FAILED", "message": "sourceId required"})
    try:
        from app.tasks.ingestion_tasks import ingest_source_feed
        task = ingest_source_feed.delay(source_id, alerts_data)
        return {"taskId": task.id, "status": "queued", "alertCount": len(alerts_data)}
    except Exception as e:
        logger.warning(f"Celery unavailable, sync fallback: {e}")
        return {"taskId": "sync", "status": "accepted", "alertCount": len(alerts_data)}


@router.get("/search")
async def search_alerts(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(25, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import text as sa_text
    offset = (page - 1) * limit
    stmt = sa_text("""
        SELECT id::text, event, headline, severity, effective, expires,
               ts_headline('english', headline || ' ' || COALESCE(description,''), plainto_tsquery(:q)) as highlight
        FROM alerts
        WHERE to_tsvector('english', headline || ' ' || COALESCE(description,'')) @@ plainto_tsquery(:q)
        AND expires > NOW()
        ORDER BY ts_rank(to_tsvector('english', headline || ' ' || COALESCE(description,'')), plainto_tsquery(:q)) DESC
        LIMIT :limit OFFSET :offset
    """)
    result = await db.execute(stmt, {"q": q, "limit": limit, "offset": offset})
    rows = result.mappings().all()
    return {"results": [dict(r) for r in rows], "page": page, "query": q}
