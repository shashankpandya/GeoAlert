from __future__ import annotations
import json, time, uuid, logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.models import Alert, AlertArea, IngestionLog, Source
from app.parsers.dispatcher import dispatch_parse
from app.parsers.cap_parser import ParseError

logger = logging.getLogger(__name__)
ERROR_RATE_THRESHOLD = 10.0

@dataclass
class IngestionResult:
    ingested: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[dict] = field(default_factory=list)
    timing: dict = field(default_factory=lambda: {
        "total_ms": 0, "validation_ms": 0,
        "classification_ms": 0, "storage_ms": 0})

class AlertIngestionService:
    async def ingest_batch(self, db: AsyncSession, source_id: str, raw_alerts: list) -> IngestionResult:
        result = IngestionResult()
        t0 = time.monotonic()
        log = IngestionLog(source_id=uuid.UUID(source_id), status="failed",
                           started_at=datetime.now(timezone.utc))
        db.add(log); await db.flush()
        total = 0
        for raw in raw_alerts:
            ext_id = raw.get("externalId", raw.get("external_id", "unknown"))
            fmt = raw.get("format", "custom")
            payload = raw.get("payload", raw)
            total += 1
            tv = time.monotonic()
            try:
                parsed_list = dispatch_parse(fmt, payload)
            except ParseError as e:
                result.errors.append({"alertId": ext_id, "error": str(e)})
                result.skipped += 1
                result.timing["validation_ms"] += int((time.monotonic()-tv)*1000)
                continue
            result.timing["validation_ms"] += int((time.monotonic()-tv)*1000)
            for parsed in parsed_list:
                src = await db.get(Source, uuid.UUID(source_id))
                if src is None:
                    result.errors.append({"alertId": parsed.external_id, "error": "Source not found"})
                    continue
                ts = time.monotonic()
                try:
                    await self._upsert(db, source_id, parsed, result)
                except Exception as e:
                    result.errors.append({"alertId": parsed.external_id, "error": str(e)})
                result.timing["storage_ms"] += int((time.monotonic()-ts)*1000)
        ttl = int((time.monotonic()-t0)*1000)
        result.timing["total_ms"] = ttl
        ec = len(result.errors)
        log.status = "success" if ec==0 else ("partial" if result.ingested>0 else "failed")
        log.alerts_ingested = result.ingested; log.alerts_updated = result.updated
        log.alerts_skipped = result.skipped; log.error_count = ec
        log.error_details = {"errors": result.errors[:50]} if result.errors else None
        log.duration_ms = ttl; log.completed_at = datetime.now(timezone.utc)
        if total > 0:
            rate = (ec / total) * 100
            await db.execute(update(Source).where(Source.id==uuid.UUID(source_id))
                .values(error_rate=rate, last_ingested_at=datetime.now(timezone.utc)))
            if rate > ERROR_RATE_THRESHOLD:
                logger.warning(f"Source {source_id} error rate {rate:.1f}% exceeds threshold")
        await db.commit()
        return result

    async def _upsert(self, db, source_id, parsed, result):
        from shapely.geometry import shape
        from geoalchemy2.shape import from_shape
        try:
            geom_wkb = from_shape(shape(parsed.geometry), srid=4326)
        except Exception:
            geom_wkb = "SRID=4326;POINT(0 0)"
        def pdt(s):
            if not s: return None
            try: return datetime.fromisoformat(s.replace("Z","+00:00"))
            except: return None
        eff = pdt(parsed.effective) or datetime.now(timezone.utc)
        exp = pdt(parsed.expires) or datetime.now(timezone.utc)
        try: raw_data = json.loads(parsed.raw_cap)
        except: raw_data = {"raw": parsed.raw_cap}
        new_id = uuid.uuid4()
        stmt = pg_insert(Alert).values(
            id=new_id, external_id=parsed.external_id,
            source_id=uuid.UUID(source_id), severity=parsed.severity,
            event=parsed.event, headline=parsed.headline,
            description=parsed.description, instruction=parsed.instruction,
            geometry=geom_wkb, effective=eff, expires=exp,
            onset=pdt(parsed.onset) if parsed.onset else None,
            raw_data=raw_data,
        ).on_conflict_do_update(
            constraint="uq_alerts_source_external",
            set_={"severity": pg_insert(Alert).excluded.severity,
                  "headline": pg_insert(Alert).excluded.headline,
                  "raw_data": pg_insert(Alert).excluded.raw_data,
                  "updated_at": datetime.now(timezone.utc)},
        ).returning(Alert.id)
        res = await db.execute(stmt)
        ret_id = res.scalar_one_or_none()
        if ret_id and parsed.areas:
            await db.execute(delete(AlertArea).where(AlertArea.alert_id==ret_id))
            for i, a in enumerate(parsed.areas):
                db.add(AlertArea(alert_id=ret_id, area_description=a[:255], sort_order=i))
        result.ingested += 1
