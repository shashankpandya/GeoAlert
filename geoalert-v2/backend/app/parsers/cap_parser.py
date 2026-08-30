"""CAP 1.2 (Common Alerting Protocol) XML parser.

Parses CAP XML documents into normalized alert dictionaries suitable
for the AlertIngestionService. Validates required fields and rejects
malformed documents with descriptive ParseError exceptions.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from lxml import etree
import re

# CAP 1.2 XML namespace
CAP_NS = "urn:oasis:names:tc:emergency:cap:1.2"
CAP = f"{{{CAP_NS}}}"

VALID_STATUS = {"Actual", "Exercise", "System", "Test", "Draft"}
VALID_MSG_TYPE = {"Alert", "Update", "Cancel", "Ack", "Error"}
VALID_SCOPE = {"Public", "Restricted", "Private"}
VALID_SEVERITY = {"Extreme", "Severe", "Moderate", "Minor", "Unknown"}
VALID_URGENCY = {"Immediate", "Expected", "Future", "Past", "Unknown"}
VALID_CERTAINTY = {"Observed", "Likely", "Possible", "Unlikely", "Unknown"}

SEVERITY_MAP = {
    "Extreme": "extreme",
    "Severe": "severe",
    "Moderate": "moderate",
    "Minor": "minor",
    "Unknown": "minor",
}


class ParseError(Exception):
    """Raised when CAP document fails validation."""

    def __init__(self, message: str, payload: Optional[str] = None, field: Optional[str] = None):
        super().__init__(message)
        self.payload = payload
        self.field = field
        self.details = {"message": message, "field": field}


@dataclass
class ParsedAlert:
    external_id: str
    event: str
    headline: str
    description: Optional[str]
    instruction: Optional[str]
    severity: str          # normalized: extreme|severe|moderate|minor
    effective: str         # ISO8601
    expires: str           # ISO8601
    onset: Optional[str]   # ISO8601
    areas: List[str]
    geometry: Optional[Dict[str, Any]]  # GeoJSON geometry or None
    raw_cap: str           # original XML string


def _get_text(element: etree._Element, tag: str) -> Optional[str]:
    """Get text of a direct child element by tag name (with CAP namespace)."""
    child = element.find(f"{CAP}{tag}")
    return child.text.strip() if child is not None and child.text else None


def _get_required(element: etree._Element, tag: str, context: str) -> str:
    """Get required field text, raise ParseError if missing."""
    val = _get_text(element, tag)
    if not val:
        raise ParseError(f"Missing required field <{tag}> in {context}", field=tag)
    return val


def _parse_polygon(polygon_text: str) -> Optional[Dict[str, Any]]:
    """Convert CAP polygon string to GeoJSON Polygon."""
    try:
        pairs = polygon_text.strip().split()
        coords = []
        for pair in pairs:
            lat_str, lon_str = pair.split(",")
            coords.append([float(lon_str), float(lat_str)])  # GeoJSON: [lon, lat]
        if len(coords) < 3:
            return None
        # Close the ring if needed
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        return {"type": "Polygon", "coordinates": [coords]}
    except (ValueError, AttributeError):
        return None


def _parse_circle(circle_text: str) -> Optional[Dict[str, Any]]:
    """Convert CAP circle string to GeoJSON Point (center) — simplified."""
    try:
        parts = circle_text.strip().split()
        center = parts[0]
        lat_str, lon_str = center.split(",")
        return {"type": "Point", "coordinates": [float(lon_str), float(lat_str)]}
    except (ValueError, IndexError, AttributeError):
        return None


def parse_cap(xml_bytes: bytes) -> ParsedAlert:
    """Parse a CAP 1.2 XML document into a ParsedAlert.

    Raises ParseError for any validation failure.
    """
    raw_xml = xml_bytes.decode("utf-8", errors="replace")

    # Parse XML
    try:
        root = etree.fromstring(xml_bytes)
    except etree.XMLSyntaxError as e:
        raise ParseError(f"Invalid XML syntax: {e}", payload=raw_xml[:500])

    # Verify root element is CAP alert
    if root.tag != f"{CAP}alert" and root.tag != "alert":
        raise ParseError(
            f"Root element must be <alert>, got <{root.tag}>",
            payload=raw_xml[:500],
        )

    # Use namespace-aware or namespace-free parsing
    ns_prefix = CAP if root.tag.startswith("{") else ""
    ns = CAP_NS if ns_prefix else ""

    def get(tag: str) -> Optional[str]:
        el = root.find(f"{ns_prefix}{tag}") if ns_prefix else root.find(tag)
        return el.text.strip() if el is not None and el.text else None

    def require(tag: str) -> str:
        val = get(tag)
        if not val:
            raise ParseError(f"Missing required field <{tag}> in <alert>", field=tag)
        return val

    # Required alert fields
    identifier = require("identifier")
    require("sender")
    require("sent")

    status = require("status")
    if status not in VALID_STATUS:
        raise ParseError(f"Invalid <status> value: {status!r}. Must be one of {VALID_STATUS}", field="status")

    msg_type = require("msgType")
    if msg_type not in VALID_MSG_TYPE:
        raise ParseError(f"Invalid <msgType> value: {msg_type!r}", field="msgType")

    scope = require("scope")
    if scope not in VALID_SCOPE:
        raise ParseError(f"Invalid <scope> value: {scope!r}", field="scope")

    # At least one <info> block required
    info_tag = f"{ns_prefix}info" if ns_prefix else "info"
    info_elements = root.findall(info_tag)
    if not info_elements:
        raise ParseError("CAP document must contain at least one <info> block", field="info")

    # Parse first <info> block (English preferred)
    info = info_elements[0]
    for inf in info_elements:
        lang_el = inf.find(f"{ns_prefix}language") if ns_prefix else inf.find("language")
        if lang_el is not None and lang_el.text and lang_el.text.lower().startswith("en"):
            info = inf
            break

    def info_get(tag: str) -> Optional[str]:
        el = info.find(f"{ns_prefix}{tag}") if ns_prefix else info.find(tag)
        return el.text.strip() if el is not None and el.text else None

    def info_require(tag: str) -> str:
        val = info_get(tag)
        if not val:
            raise ParseError(f"Missing required field <{tag}> in <info>", field=tag)
        return val

    event = info_require("event")
    severity_raw = info_require("severity")
    if severity_raw not in VALID_SEVERITY:
        raise ParseError(f"Invalid <severity>: {severity_raw!r}", field="severity")
    severity = SEVERITY_MAP[severity_raw]

    urgency = info_get("urgency")
    certainty = info_get("certainty")
    effective = info_get("effective") or get("sent") or ""
    expires = info_get("expires") or ""
    onset = info_get("onset")
    headline = info_get("headline") or event
    description = info_get("description")
    instruction = info_get("instruction")

    if not expires:
        raise ParseError("Missing required <expires> in <info>", field="expires")

    # Parse areas
    area_tag = f"{ns_prefix}area" if ns_prefix else "area"
    area_elements = info.findall(area_tag)
    areas: List[str] = []
    geometry = None

    for area_el in area_elements:
        desc_el = area_el.find(f"{ns_prefix}areaDesc") if ns_prefix else area_el.find("areaDesc")
        if desc_el is not None and desc_el.text:
            areas.append(desc_el.text.strip())

        # Try polygon first
        if geometry is None:
            poly_el = area_el.find(f"{ns_prefix}polygon") if ns_prefix else area_el.find("polygon")
            if poly_el is not None and poly_el.text:
                geometry = _parse_polygon(poly_el.text)

        # Try circle
        if geometry is None:
            circle_el = area_el.find(f"{ns_prefix}circle") if ns_prefix else area_el.find("circle")
            if circle_el is not None and circle_el.text:
                geometry = _parse_circle(circle_el.text)

    # Default geometry if none found
    if geometry is None:
        geometry = {"type": "Point", "coordinates": [0.0, 0.0]}

    return ParsedAlert(
        external_id=identifier,
        event=event,
        headline=headline,
        description=description,
        instruction=instruction,
        severity=severity,
        effective=effective,
        expires=expires,
        onset=onset,
        areas=areas,
        geometry=geometry,
        raw_cap=raw_xml,
    )
