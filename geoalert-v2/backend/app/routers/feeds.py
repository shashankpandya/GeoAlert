"""
Feed sync endpoints — trigger live data ingestion from official sources.
"""
from __future__ import annotations
import uuid, logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Source
from app.services.nws_feed import fetch_nws_alerts
from app.services.ingestion import AlertIngestionService

router = APIRouter(prefix="/api/feeds", tags=["feeds"])
logger = logging.getLogger(__name__)
ingestion_svc = AlertIngestionService()

NWS_SOURCE_URL = "https://api.weather.gov/alerts"
NWS_SOURCE_NAME = "National Weather Service (NWS)"

async def _ensure_nws_source(db: AsyncSession) -> str:
    """Get or create the NWS source record, return its ID."""
    existing = await db.execute(select(Source).where(Source.url == NWS_SOURCE_URL))
    source = existing.scalar_one_or_none()
    if source is None:
        source = Source(
            name=NWS_SOURCE_NAME,
            url=NWS_SOURCE_URL,
            classification="official",
            verification_level="verified",
            status="active",
            https_verified=True,
            domain_reputation="high",
            listed_in_registry=True,
            registry_name="National Weather Service",
            country="US",
        )
        db.add(source)
        await db.commit()
        await db.refresh(source)
        logger.info(f"Created NWS source: {source.id}")
    return str(source.id)

async def _sync_nws_background(area: Optional[str], db_factory):
    """Background task: fetch NWS alerts and ingest them."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            source_id = await _ensure_nws_source(db)
            parsed_alerts = await fetch_nws_alerts(area=area)
            if not parsed_alerts:
                logger.info("NWS returned 0 alerts")
                return
            raw_alerts = [
                {
                    "externalId": p.external_id,
                    "format": "custom",
                    "payload": {
                        "external_id": p.external_id,
                        "event": p.event,
                        "severity": p.severity,
                        "effective": p.effective,
                        "expires": p.expires,
                        "onset": p.onset,
                        "headline": p.headline,
                        "description": p.description,
                        "instruction": p.instruction,
                        "geometry": p.geometry,
                        "areas": p.areas,
                    }
                }
                for p in parsed_alerts
            ]
            result = await ingestion_svc.ingest_batch(db, source_id, raw_alerts)
            logger.info(f"NWS sync complete: {result.ingested} ingested, {result.updated} updated, {result.skipped} skipped, {result.errors[:3]} errors")
        except Exception as e:
            logger.exception(f"NWS sync failed: {e}")

@router.post("/sync/nws")
async def sync_nws(
    background_tasks: BackgroundTasks,
    area: Optional[str] = Query(None, description="2-letter US state code, e.g. CA or TX. Omit for all US alerts."),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a live sync from the National Weather Service API.

    Fetches all active NWS alerts (or for a specific state) and stores them
    in the database. Runs in the background and returns immediately.

    **No API key required.** NWS data is free and public.

    After calling this, query GET /api/alerts to see the ingested data.
    """
    background_tasks.add_task(_sync_nws_background, area, None)
    return {
        "status": "syncing",
        "message": f"Fetching NWS alerts{f' for {area.upper()}' if area else ' for all US'} in the background",
        "check_results": "GET /api/alerts",
        "source": "National Weather Service (api.weather.gov)",
    }

@router.get("/sync/nws/status")
async def nws_status(db: AsyncSession = Depends(get_db)):
    """Check the current NWS source status and last sync time."""
    existing = await db.execute(select(Source).where(Source.url == NWS_SOURCE_URL))
    source = existing.scalar_one_or_none()
    if not source:
        return {
            "status": "not_configured",
            "message": "NWS source not yet added. Call POST /api/feeds/sync/nws to initialize.",
        }
    return {
        "status": "configured",
        "source_id": str(source.id),
        "name": source.name,
        "classification": source.classification,
        "last_synced": source.last_ingested_at.isoformat() if source.last_ingested_at else None,
        "error_rate": float(source.error_rate or 0),
    }
