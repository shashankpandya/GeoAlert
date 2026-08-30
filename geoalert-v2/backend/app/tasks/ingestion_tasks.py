from __future__ import annotations
import asyncio, logging
from typing import List, Any
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(name="ingest_source_feed", bind=True, max_retries=3)
def ingest_source_feed(self, source_id: str, alerts: List[Any]) -> dict:
    try:
        result = asyncio.run(_async_ingest(source_id, alerts))
        return {"ingested": result.ingested, "updated": result.updated,
                "skipped": result.skipped, "errors": result.errors[:20],
                "timing": result.timing}
    except Exception as exc:
        logger.exception(f"Ingestion task failed for source {source_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)

async def _async_ingest(source_id: str, alerts: list):
    from app.database import AsyncSessionLocal
    from app.services.ingestion import AlertIngestionService
    svc = AlertIngestionService()
    async with AsyncSessionLocal() as db:
        return await svc.ingest_batch(db, source_id, alerts)
