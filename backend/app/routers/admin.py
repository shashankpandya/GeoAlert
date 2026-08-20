from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.models import Alert, Source
from app.services.health_monitor import get_provider_health

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    providers = await get_provider_health(db)

    sev_result = await db.execute(
        select(Alert.severity, func.count())
        .group_by(Alert.severity)
        .where(Alert.expires > func.now())
    )
    severity_counts = {row[0]: row[1] for row in sev_result}

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "providers": providers,
        "alertCountsBySeverity": severity_counts,
        "systemStatus": "operational",
    }
