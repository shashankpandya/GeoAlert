from __future__ import annotations
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Source, IngestionLog


async def get_provider_health(db: AsyncSession) -> list[dict]:
    stmt = select(Source).where(Source.status == "active")
    result = await db.execute(stmt)
    sources = result.scalars().all()

    health = []
    for src in sources:
        last_30d = datetime.now(timezone.utc) - timedelta(days=30)
        logs_stmt = select(IngestionLog).where(
            IngestionLog.source_id == src.id,
            IngestionLog.started_at >= last_30d,
        )
        logs_result = await db.execute(logs_stmt)
        logs = logs_result.scalars().all()

        total = len(logs)
        success = sum(1 for l in logs if l.status == "success")
        uptime = (success / total * 100) if total > 0 else 100.0

        health.append({
            "source_id": str(src.id),
            "name": src.name,
            "classification": src.classification,
            "uptime_percentage": round(uptime, 1),
            "error_rate": float(src.error_rate or 0),
            "last_ingested_at": src.last_ingested_at.isoformat() if src.last_ingested_at else None,
            "status": src.status,
        })

    return health
