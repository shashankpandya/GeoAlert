// ============================================================
// GeoAlert v2 — Shared Type Definitions
// ============================================================

// --------------- Geographic Types ---------------

export type GeographicCoordinates = {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
};

export type CoarseLocation = {
  city?: string;
  region: string;     // State/province
  country: string;    // ISO 3166-1 alpha-2
};

export type BoundingBox = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

// --------------- Temporal Types ---------------

export type ISO8601Timestamp = string;  // "2024-01-15T14:30:00Z"

export type FreshnessState = 'fresh' | 'aging' | 'stale';

/**
 * Calculates the freshness state of an alert based on its effective timestamp.
 * - fresh:  age < 60 minutes
 * - aging:  60 <= age < 120 minutes
 * - stale:  age >= 120 minutes
 */
export function calculateFreshness(effectiveTime: ISO8601Timestamp): FreshnessState {
  const ageMinutes = (Date.now() - new Date(effectiveTime).getTime()) / 60_000;
  if (ageMinutes < 60) return 'fresh';
  if (ageMinutes < 120) return 'aging';
  return 'stale';
}

// --------------- Alert Core Types ---------------

export type Severity = 'extreme' | 'severe' | 'moderate' | 'minor';

export type SourceClassification = 'official' | 'community';

export type VerificationLevel = 'verified' | 'unverified' | 'suspicious';

export interface SourceProvenance {
  classification: SourceClassification;
  displayName: string;
  url: string;
  verificationDetails: {
    httpsVerified: boolean;
    domainReputation: 'high' | 'medium' | 'low';
    dkimVerified?: boolean;
    listedInOfficialRegistry: boolean;
    registryName?: string;
  };
}

export interface Alert {
  id: string;
  externalId: string;
  sourceId: string;
  severity: Severity;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  source: SourceProvenance;
  geometry: GeoJSON.Geometry;
  effective: ISO8601Timestamp;
  expires: ISO8601Timestamp;
  onset?: ISO8601Timestamp;
  areas: string[];
  metadata: {
    isStale: boolean;
    ageMinutes: number;
    verificationLevel: VerificationLevel;
    ingestedAt: ISO8601Timestamp;
  };
}

export interface MinimalAlert {
  id: string;
  severity: Severity;
  event: string;
  headline: string;
  instruction: string;
  source: SourceClassification;
  areas: string[];
  effective: ISO8601Timestamp;
  expires: ISO8601Timestamp;
  isStale: boolean;
}

// --------------- GeoJSON Feature Types ---------------

export interface AlertFeatureCollection extends GeoJSON.FeatureCollection {
  features: AlertFeature[];
}

export interface AlertFeature extends GeoJSON.Feature {
  properties: {
    alertId: string;
    severity: Severity;
    event: string;
    headline: string;
    source: SourceClassification;
    isStale: boolean;
  };
}

// --------------- API Request/Response Types ---------------

export interface AlertQueryParams {
  region?: string;
  bbox?: BoundingBox;
  severity?: Severity[];
  source?: 'official' | 'community' | 'all';
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}

export interface AlertsResponse {
  alerts: Alert[];
  metadata: {
    total: number;
    returned: number;
    timestamp: ISO8601Timestamp;
    staleCutoff: ISO8601Timestamp;
  };
}

export interface AlertDetailResponse {
  alert: Alert;
  relatedAlerts: Alert[];
  metadata: {
    fetchedAt: ISO8601Timestamp;
    isCached: boolean;
  };
}

export interface ClassifySourceRequest {
  url: string;
  name?: string;
  providedClassification?: SourceClassification;
}

export interface ClassifySourceResponse {
  classification: SourceClassification;
  confidence: number;
  verificationDetails: {
    httpsVerified: boolean;
    domainReputation: 'high' | 'medium' | 'low';
    listedInOfficialRegistry: boolean;
    registryName?: string;
    manualReviewRequired: boolean;
  };
  reasoning: string[];
}

export interface RawAlertData {
  externalId: string;
  format: 'cap' | 'geojson' | 'custom';
  payload: object;
}

export interface IngestAlertsRequest {
  sourceId: string;
  alerts: RawAlertData[];
}

export interface IngestAlertsResponse {
  ingested: number;
  updated: number;
  skipped: number;
  errors: Array<{
    alertId: string;
    error: string;
  }>;
  timing: {
    totalMs: number;
    validationMs: number;
    classificationMs: number;
    storageMs: number;
  };
}

// --------------- Error Response Type ---------------

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: object;
    timestamp: ISO8601Timestamp;
    requestId: string;
  };
}

// --------------- Accessibility Types ---------------

export interface AccessibilityPreferences {
  highContrast: boolean;
  textScale: 100 | 150 | 200 | 300 | 400;
  screenReaderOptimized: boolean;
  reducedMotion: boolean;
}

// --------------- Source Types ---------------

export interface AlertSource {
  id: string;
  name: string;
  url: string;
  classification: SourceClassification;
  verificationLevel: VerificationLevel;
  status: 'active' | 'inactive' | 'suspended';
  lastIngestedAt: ISO8601Timestamp | null;
  errorRate: number;
  metadata: {
    country?: string;
    region?: string;
    coverage: string[];
  };
}

export interface SourcesResponse {
  sources: AlertSource[];
  metadata: {
    total: number;
    officialCount: number;
    communityCount: number;
  };
}
