from __future__ import annotations
import json
from typing import Any, List
from app.parsers.cap_parser import parse_cap, ParsedAlert, ParseError
from app.parsers.geojson_parser import parse_geojson_collection
from app.parsers.custom_parser import parse_custom


def dispatch_parse(format: str, payload: Any) -> List[ParsedAlert]:
    if format == "cap":
        if isinstance(payload, dict):
            raise ParseError("CAP format requires XML bytes, not dict", field="payload")
        if isinstance(payload, str): payload = payload.encode("utf-8")
        return [parse_cap(payload)]
    elif format == "geojson":
        if isinstance(payload, (str, bytes)):
            try: payload = json.loads(payload)
            except json.JSONDecodeError as e: raise ParseError(f"Invalid JSON: {e}", field="payload")
        return parse_geojson_collection(payload)
    elif format == "custom":
        return [parse_custom(payload)]
    else:
        raise ParseError(f"Unknown format: {format!r}", field="format")
