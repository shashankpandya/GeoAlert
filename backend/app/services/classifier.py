"""Source classification service."""
from __future__ import annotations
import re
from urllib.parse import urlparse
from dataclasses import dataclass, field
from typing import List, Optional, Dict

OFFICIAL_REGISTRY: Dict[str, str] = {
    "alerts.weather.gov": "National Weather Service",
    "weather.gov": "National Weather Service",
    "api.weather.gov": "National Weather Service",
    "www.fema.gov": "FEMA",
    "fema.gov": "FEMA",
    "ready.gov": "FEMA Ready",
    "ipaws.gov": "IPAWS",
    "usgs.gov": "USGS",
    "earthquake.usgs.gov": "USGS Earthquake Hazards",
    "nhc.noaa.gov": "National Hurricane Center",
    "spc.noaa.gov": "Storm Prediction Center",
    "tsunami.gov": "Tsunami Warning Center",
    "nws.noaa.gov": "National Weather Service",
}

MEDIUM_REPUTATION_DOMAINS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk",
    "cnn.com", "nbcnews.com", "cbsnews.com", "nytimes.com",
}


@dataclass
class ClassificationResult:
    classification: str
    confidence: float
    https_verified: bool
    domain_reputation: str
    listed_in_official_registry: bool
    registry_name: Optional[str]
    manual_review_required: bool
    reasoning: List[str] = field(default_factory=list)


class SourceClassifier:
    def classify(self, url: str) -> ClassificationResult:
        reasoning: List[str] = []
        parsed = urlparse(url.strip())
        hostname = parsed.hostname or ""

        https_verified = parsed.scheme == "https"
        if not https_verified:
            reasoning.append("URL uses HTTP instead of HTTPS")

        registry_name: Optional[str] = None
        listed_in_registry = False

        if hostname in OFFICIAL_REGISTRY:
            listed_in_registry = True
            registry_name = OFFICIAL_REGISTRY[hostname]
            reasoning.append(f"Domain found in official registry: {registry_name}")
        else:
            parts = hostname.split(".")
            for i in range(1, len(parts)):
                parent = ".".join(parts[i:])
                if parent in OFFICIAL_REGISTRY:
                    listed_in_registry = True
                    registry_name = OFFICIAL_REGISTRY[parent]
                    reasoning.append(f"Parent domain found in registry: {registry_name}")
                    break

        if not listed_in_registry and (hostname.endswith(".gov") or hostname.endswith(".mil")):
            listed_in_registry = True
            registry_name = f"US Government ({hostname})"
            reasoning.append(f"Domain is a .gov/.mil TLD")

        if listed_in_registry or hostname.endswith(".gov") or hostname.endswith(".mil") or hostname.endswith(".edu"):
            domain_reputation = "high"
        elif any(hostname == d or hostname.endswith("." + d) for d in MEDIUM_REPUTATION_DOMAINS):
            domain_reputation = "medium"
        else:
            domain_reputation = "low"

        if listed_in_registry and https_verified:
            classification, confidence = "official", 0.98
        elif listed_in_registry:
            classification, confidence = "official", 0.75
        elif domain_reputation == "high":
            classification, confidence = "official", 0.85
        elif domain_reputation == "medium":
            classification, confidence = "community", 0.70
        else:
            classification, confidence = "community", 0.60

        if not https_verified:
            confidence = max(0.1, confidence - 0.20)

        return ClassificationResult(
            classification=classification,
            confidence=round(confidence, 4),
            https_verified=https_verified,
            domain_reputation=domain_reputation,
            listed_in_official_registry=listed_in_registry,
            registry_name=registry_name,
            manual_review_required=confidence < 0.80,
            reasoning=reasoning,
        )
