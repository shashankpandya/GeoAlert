"""
NWS (National Weather Service) feed integration.
Uses the free, unauthenticated NWS API v2 at api.weather.gov.
No API key required. Fetches active alerts for the US.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.parsers.cap_parser import ParsedAlert, ParseError

logger = logging.getLogger(__name__)

NWS_API_BASE = "https://api.weather.gov"
NWS_HEADERS = {
    "User-Agent": "GeoAlert/2.0 (emergency-alert-platform; contact@geoalert.dev)",
    "Accept": "application/geo+json",
}

SEVERITY_MAP = {
    "Extreme": "extreme",
    "Severe": "severe",
    "Moderate": "moderate",
    "Minor": "minor",
    "Unknown": "minor",
}

def _parse_nws_feature(feature: Dict[str, Any]) -> Optional[ParsedAlert]:
    """Convert a NWS GeoJSON Feature into a ParsedAlert."""
    try:
        props = feature.get("properties", {})
        geometry = feature.get("geometry")
        if geometry is None:
            geometry = {"type": "Point", "coordinates": [0.0, 0.0]}
        severity_raw = props.get("severity", "Unknown")
        severity = SEVERITY_MAP.get(severity_raw, "minor")
        external_id = props.get("id", "") or feature.get("id", "")
        event = props.get("event", "Weather Alert")
        headline = props.get("headline") or event
        description = props.get("description", "")
        instruction = props.get("instruction", "")
        effective = props.get("effective", datetime.now(timezone.utc).isoformat())
        expires = props.get("expires") or props.get("ends")
        if not expires:
            from datetime import timedelta
            expires = (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat()
        onset = props.get("onset")
        area_desc = props.get("areaDesc", "")
        areas = [a.strip() for a in area_desc.split(";") if a.strip()] if area_desc else []
        import json
        return ParsedAlert(
            external_id=str(external_id),
            event=event,
            headline=headline[:500] if headline else event,
            description=description[:2000] if description else None,
            instruction=instruction[:1000] if instruction else None,
            severity=severity,
            effective=effective,
            expires=expires,
            onset=onset,
            areas=areas[:10],
            geometry=geometry,
            raw_cap=json.dumps(props),
        )
    except Exception as e:
        logger.warning(f"Failed to parse NWS feature: {e}")
        return None

async def fetch_nws_alerts(
    area: Optional[str] = None,
    severity: Optional[List[str]] = None,
    limit: int = 500,
) -> List[ParsedAlert]:
    """
    Fetch active alerts from the NWS API.

    Args:
        area: Optional 2-letter state code (e.g. 'CA', 'TX')
        severity: Optional list of severity levels to filter
        limit: Maximum alerts to return
    """
    url = f"{NWS_API_BASE}/alerts/active"
    params: Dict[str, Any] = {"limit": min(limit, 500), "status": "actual"}
    if area:
        params["area"] = area.upper()
    if severity:
        params["severity"] = ",".join(severity)

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, headers=NWS_HEADERS, params=params)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"NWS API HTTP error: {e}")
            return []
        except Exception as e:
            logger.error(f"NWS API request failed: {e}")
            return []

    features = data.get("features", [])
    logger.info(f"NWS returned {len(features)} features")
    results = []
    for feature in features:
        parsed = _parse_nws_feature(feature)
        if parsed:
            results.append(parsed)
    return results
