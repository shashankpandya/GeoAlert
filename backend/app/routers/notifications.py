from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/user/notification-preferences", tags=["notifications"])
_store: dict = {}


class NotificationPrefs(BaseModel):
    zones: List[dict] = []
    min_severity: str = "moderate"
    channels: List[str] = []


@router.get("")
async def get_prefs(user_id: Optional[str] = None):
    return _store.get(user_id or "anonymous", NotificationPrefs())


@router.put("")
async def update_prefs(prefs: NotificationPrefs, user_id: Optional[str] = None):
    _store[user_id or "anonymous"] = prefs
    return {"status": "updated", "prefs": prefs}
