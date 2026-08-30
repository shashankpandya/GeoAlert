"""Tests for CAP and GeoJSON parsers — no database required."""
import pytest
from app.parsers.cap_parser import parse_cap, ParseError
from app.parsers.geojson_parser import parse_geojson_collection
from app.parsers.custom_parser import parse_custom


VALID_CAP = b"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>test-001</identifier>
  <sender>test@nws.noaa.gov</sender>
  <sent>2024-01-15T14:00:00Z</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <event>Severe Thunderstorm Warning</event>
    <urgency>Immediate</urgency>
    <severity>Severe</severity>
    <certainty>Observed</certainty>
    <effective>2024-01-15T14:00:00Z</effective>
    <expires>2024-01-15T16:00:00Z</expires>
    <headline>Severe Thunderstorm Warning</headline>
    <area><areaDesc>Downtown Seattle</areaDesc></area>
  </info>
</alert>"""


def test_cap_parser_valid():
    result = parse_cap(VALID_CAP)
    assert result.severity == "severe"
    assert result.external_id == "test-001"
    assert result.event == "Severe Thunderstorm Warning"
    assert "Downtown Seattle" in result.areas


def test_cap_parser_invalid_raises():
    with pytest.raises(ParseError):
        parse_cap(b"<not-an-alert/>")


def test_geojson_parser():
    fc = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-122.33, 47.61]},
            "properties": {
                "event": "Flood Warning",
                "severity": "severe",
                "effective": "2024-01-15T14:00:00Z",
                "expires": "2024-01-16T14:00:00Z",
            },
        }],
    }
    results = parse_geojson_collection(fc)
    assert len(results) == 1
    assert results[0].severity == "severe"


def test_custom_parser():
    payload = {
        "external_id": "c-001",
        "event": "Tornado Warning",
        "severity": "extreme",
        "effective": "2024-01-15T14:00:00Z",
        "expires": "2024-01-15T15:00:00Z",
    }
    result = parse_custom(payload)
    assert result.severity == "extreme"
    assert result.external_id == "c-001"


def test_classifier():
    from app.services.classifier import SourceClassifier
    c = SourceClassifier()
    r = c.classify("https://alerts.weather.gov/")
    assert r.classification == "official"
    assert r.confidence >= 0.95

    r2 = c.classify("http://unknown-site.example.com/")
    assert r2.classification == "community"
