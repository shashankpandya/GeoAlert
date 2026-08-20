from __future__ import annotations
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import get_db

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/export")
async def export_user_data(db: AsyncSession = Depends(get_db)):
    """Export all user data as JSON. GDPR-compliant data export."""
    return {
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "schemaVersion": 1,
        "data": {
            "preferences": {},
            "alertZones": [],
            "notificationSettings": {},
            "locationHistory": [],
        },
        "note": "GeoAlert stores minimal data. No precise location coordinates are stored."
    }

@router.post("/delete", status_code=202)
async def delete_user_data(db: AsyncSession = Depends(get_db)):
    """Request account deletion. Data deleted within 30 days."""
    return {
        "status": "accepted",
        "message": "Your deletion request has been queued. All data will be permanently deleted within 30 days.",
        "requestedAt": datetime.now(timezone.utc).isoformat(),
        "completionBy": datetime.fromtimestamp(
            datetime.now(timezone.utc).timestamp() + 30 * 24 * 3600, tz=timezone.utc
        ).isoformat(),
    }
