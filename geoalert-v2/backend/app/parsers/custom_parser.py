from __future__ import annotations
from typing import Any, List, Optional
import json
from app.parsers.cap_parser import ParsedAlert, ParseError

VALID_SEVERITIES = {"extreme", "severe", "moderate", "minor"}


def parse_custom(payload):
    if not isinstance(payload, dict):
        raise ParseError(f"Custom format requires dict, got {type(payload).__name__}")
    def req(k):
        v = payload.get(k)
        if not v: raise ParseError(f"Missing required field: {k!r}", field=k)
        return str(v).strip()
    def opt(k): v = payload.get(k); return str(v).strip() if v is not None else None
    sev = req("severity").lower()
    if sev not in VALID_SEVERITIES: sev = "minor"
    geometry = payload.get("geometry") or {"type": "Point", "coordinates": [0.0, 0.0]}
    raw_areas = payload.get("areas", [])
    areas = raw_areas if isinstance(raw_areas, list) else [str(raw_areas)]
    return ParsedAlert(
        external_id=req("external_id"), event=req("event"),
        headline=opt("headline") or req("event"),
        description=opt("description"), instruction=opt("instruction"),
        severity=sev, effective=req("effective"), expires=req("expires"),
        onset=opt("onset"), areas=areas,
        geometry=geometry, raw_cap=json.dumps(payload),
    )
