from __future__ import annotations
from typing import List, Optional, Dict, Any
import json
from app.parsers.cap_parser import ParseError, ParsedAlert

VALID_SEVERITIES = {"extreme", "severe", "moderate", "minor"}


def parse_geojson_feature(feature):
    if not isinstance(feature, dict):
        raise ParseError("GeoJSON feature must be a dict")
    if feature.get("type") != "Feature":
        raise ParseError("Expected GeoJSON Feature")
    props = feature.get("properties") or {}
    geometry = feature.get("geometry") or {"type": "Point", "coordinates": [0.0, 0.0]}
    def g(k): v = props.get(k); return str(v).strip() if v is not None else None
    def r(k):
        v = g(k)
        if not v: raise ParseError(f"Missing property: {k!r}", field=k)
        return v
    event = r("event")
    sev = r("severity").lower()
    sev_map = {"high":"severe","medium":"moderate","low":"minor","critical":"extreme"}
    if sev not in VALID_SEVERITIES: sev = sev_map.get(sev, "minor")
    effective = r("effective")
    expires = r("expires")
    headline = g("headline") or event
    area_val = g("areaDesc") or g("area")
    areas = [area_val] if area_val else []
    return ParsedAlert(
        external_id=g("id") or "",
        event=event, headline=headline,
        description=g("description"), instruction=g("instruction"),
        severity=sev, effective=effective, expires=expires,
        onset=g("onset"), areas=areas,
        geometry=geometry, raw_cap=json.dumps(feature),
    )


def parse_geojson_collection(data):
    if not isinstance(data, dict):
        raise ParseError("GeoJSON input must be a JSON object")
    if data.get("type") != "FeatureCollection":
        raise ParseError("Expected FeatureCollection")
    features = data.get("features")
    if not isinstance(features, list):
        raise ParseError("FeatureCollection must have features array")
    results, errors = [], []
    for i, f in enumerate(features):
        try: results.append(parse_geojson_feature(f))
        except ParseError as e: errors.append(f"Feature[{i}]: {e}")
    if not results and errors: raise ParseError(f"All features failed: {errors[0]}")
    return results
