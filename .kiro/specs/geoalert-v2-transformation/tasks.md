# Implementation Plan: GeoAlert v2 Transformation

## Overview

Transform GeoAlert from a map-centric visualization tool into a safety-first crisis response platform. The implementation follows a progressive build order: project scaffold → core data models and API → crisis mode UI → trust/provenance → map view → temporal freshness → offline resilience → accessibility → security → CI/CD. Each step wires into the previous so no code is left orphaned.

**Languages:** TypeScript (Next.js 14+ frontend), Python (FastAPI backend)  
**Testing:** Vitest + React Testing Library + fast-check (frontend), Pytest + Hypothesis (backend), Playwright (E2E)

---

## Tasks

- [x] 1. Scaffold project structure and shared configuration
  - [x] 1.1 Initialize Next.js 14+ App Router project with TypeScript and Tailwind CSS
    - Run `npx create-next-app@latest` with `--typescript --tailwind --app --src-dir` flags
    - Configure `tsconfig.json` with strict mode and path aliases (`@/components`, `@/lib`, `@/types`)
    - Add `eslint`, `prettier`, and `eslint-config-next`; create `.eslintrc.json` and `.prettierrc`
    - _Requirements: 28.3, 29.1, 29.2_

  - [x] 1.2 Initialize FastAPI project with virtual environment and dependency management
    - Create `backend/` directory with `pyproject.toml` (or `requirements.txt`) pinning FastAPI, SQLAlchemy, asyncpg, celery, redis, GeoAlchemy2, pydantic v2, alembic, pytest, hypothesis
    - Create `backend/app/main.py` with FastAPI app instance and CORS middleware configured for Next.js dev origin
    - Create `backend/app/config.py` using `pydantic-settings` for all env vars (DATABASE_URL, REDIS_URL, API_KEY, etc.) with documented defaults
    - _Requirements: 28.4, 28.3_

  - [x] 1.3 Set up PostgreSQL + PostGIS schema with Alembic migrations
    - Write initial Alembic migration creating `sources`, `alerts`, `alert_areas`, and `ingestion_logs` tables exactly as specified in the design's PostgreSQL schema section
    - Include all indexes: `idx_sources_classification`, `idx_sources_status`, `idx_sources_url_hash`, `idx_alerts_geometry` (GIST), `idx_alerts_active`, `idx_alerts_severity`, `idx_alerts_expires`, `idx_alert_areas_alert_id`, `idx_ingestion_logs_source_id`
    - Add `UNIQUE(source_id, external_id)` constraint on `alerts` for idempotency
    - _Requirements: 13.3, 15.2_

  - [x] 1.4 Define all shared TypeScript types in `src/types/index.ts`
    - Implement all types from the design's TypeScript Type Definitions section: `GeographicCoordinates`, `CoarseLocation`, `BoundingBox`, `ISO8601Timestamp`, `FreshnessState`, `Severity`, `SourceClassification`, `VerificationLevel`, `SourceProvenance`, `Alert`, `MinimalAlert`, `AlertFeatureCollection`, `AlertFeature`, and all API request/response interfaces
    - Export `calculateFreshness(effectiveTime: ISO8601Timestamp): FreshnessState` as a pure function implementing the fresh/aging/stale thresholds
    - _Requirements: 2.1, 5.1_

  - [ ]* 1.5 Write unit tests for `calculateFreshness` boundary values
    - Test 59-minute-old alert → `fresh`; 60-minute-old → `aging`; 119-minute-old → `aging`; 120-minute-old → `stale`
    - Test with exact boundary timestamps to confirm monotonic transitions (no fresh→stale without aging)
    - _Requirements: 2.1, 2.7_

- [x] 2. Implement FastAPI data models and core alert endpoints
  - [x] 2.1 Create SQLAlchemy ORM models for `Source`, `Alert`, `AlertArea`, and `IngestionLog`
    - Map all columns from the migration; use GeoAlchemy2 `Geometry` type for `alerts.geometry` with `srid=4326`
    - Add `updated_at` trigger via SQLAlchemy `event.listen` or Alembic-managed PostgreSQL trigger
    - _Requirements: 13.3, 15.2_

  - [x] 2.2 Implement Pydantic v2 schemas for all API request/response types
    - Create `backend/app/schemas/alerts.py` with `AlertResponse`, `AlertsResponse`, `AlertQueryParams`, `AlertDetailResponse`
    - Create `backend/app/schemas/sources.py` with `SourceResponse`, `SourcesResponse`, `ClassifySourceRequest`, `ClassifySourceResponse`
    - Add validators: coordinate ranges (lat −90..90, lon −180..180), severity enum, GeoJSON RFC 7946 geometry validation
    - _Requirements: 21.1, 21.2, 21.7_

  - [x] 2.3 Implement `GET /api/alerts` endpoint with PostGIS spatial filtering
    - Accept `region`, `bbox`, `severity[]`, `source`, `limit`, `offset`, `includeExpired` query params
    - Use `ST_Intersects` for bounding box filtering with the GIST spatial index
    - Mark alerts as stale if `(NOW() - effective) > INTERVAL '120 minutes'`; return `staleCutoff` in metadata
    - Apply Redis cache with 5-minute TTL keyed on canonical query params; set `isCached` metadata field
    - _Requirements: 8.1, 8.2, 15.1, 15.3_

  - [x] 2.4 Implement `GET /api/alerts/{id}` and `GET /api/sources` endpoints
    - `GET /api/alerts/{id}`: return full `Alert` + `relatedAlerts` (spatially overlapping active alerts via `ST_Intersects`); 404 on missing
    - `GET /api/sources`: filter by `classification` and `status` query params; return `officialCount` / `communityCount` in metadata
    - Apply standardized error response format (`ErrorResponse`) with `code`, `message`, `timestamp`, `requestId` on all error paths
    - _Requirements: 26.1, 26.2_

  - [ ]* 2.5 Write property test for spatial filter correctness (Property 9)
    - **Property 9: Spatial Filter Correctness**
    - Generate random GeoJSON Point geometries and bounding boxes using Hypothesis `@given` with `st.floats` strategies
    - Insert generated alerts into a test database, call `GET /api/alerts?bbox=...`, assert returned set equals Python-side `ST_Intersects` truth
    - **Validates: Requirements 8.1**

  - [ ]* 2.6 Write property test for severity filter correctness (Property 10)
    - **Property 10: Severity Filter Correctness**
    - Generate random alert sets with all severity combinations; apply random subsets of `['extreme','severe','moderate','minor']` as filter
    - Assert returned alerts all have severity in the filter set; assert no matching alert is absent from results
    - **Validates: Requirements 8.2**

- [x] 3. Implement source classification service
  - [x] 3.1 Implement `SourceClassifier` in `backend/app/services/classifier.py`
    - Step 1: Check `sources` table for known URL (return cached classification)
    - Step 2: Verify HTTPS scheme; flag HTTP sources as low reputation
    - Step 3: Check domain against hardcoded official registry list (weather.gov, fema.gov, state `.gov` patterns); set `listedInOfficialRegistry`
    - Step 4: Compute `domainReputation` (`high` for `.gov`/`.edu`, `medium` for known news domains, `low` otherwise)
    - Step 5: Return `ClassifySourceResponse` with `confidence` (0–1), `reasoning[]`, and `manualReviewRequired` flag when confidence < 0.8
    - _Requirements: 1.1, 3.2_

  - [x] 3.2 Implement `POST /api/sources/classify` endpoint wired to `SourceClassifier`
    - Accept `ClassifySourceRequest`; call classifier; persist result to `sources` table if confidence ≥ 0.8
    - Return full `ClassifySourceResponse` including `verificationDetails` and `reasoning`
    - _Requirements: 1.1, 1.5_

  - [ ]* 3.3 Write property test for source classification determinism (Property 3)
    - **Property 3: Source Classification Determinism**
    - Generate random URLs (mix of http/https, .gov/.com/.org, known/unknown domains) using Hypothesis
    - Call `SourceClassifier.classify(url)` twice for each URL; assert both calls return identical `classification` and `verificationLevel`
    - **Validates: Requirements 3.2**

- [x] 4. Implement alert ingestion pipeline
  - [x] 4.1 Implement CAP 1.2 XML parser in `backend/app/parsers/cap_parser.py`
    - Parse `<alert>`, `<info>`, `<area>` elements into the canonical `Alert` schema using `lxml`
    - Validate required fields: `identifier`, `sender`, `sent`, `status`, `msgType`, `scope`, at least one `<info>` block
    - Reject invalid documents; raise `ParseError` with original payload and structured error details
    - _Requirements: 14.1, 14.3, 14.4_

  - [x] 4.2 Implement GeoJSON and custom format parsers in `backend/app/parsers/`
    - `geojson_parser.py`: validate GeoJSON FeatureCollection against RFC 7946; extract `severity`, `headline`, `instruction`, geometry
    - `custom_parser.py`: extensible base class for future formats; implement a passthrough validator for `format='custom'`
    - Route `RawAlertData.format` to the correct parser; dead-letter-queue failures to `ingestion_logs` with `status='failed'`
    - _Requirements: 14.1, 14.5_

  - [x] 4.3 Implement `AlertIngestionService` with idempotent upsert logic
    - On each alert: parse → validate schema → classify source → upsert using `INSERT ... ON CONFLICT (source_id, external_id) DO UPDATE`
    - Store original payload in `raw_data` JSONB column without modification
    - Write `IngestionLog` record with timing breakdown (`validationMs`, `classificationMs`, `storageMs`)
    - Increment `sources.error_rate` when validation fails; trigger admin notification path when rate > 10%
    - _Requirements: 13.1, 13.2, 13.4, 13.5, 4.2, 12.4_

  - [x] 4.4 Implement Celery task `ingest_source_feed` and `POST /api/alerts/ingest` endpoint
    - Celery task: accept `sourceId` + `alerts[]`; call `AlertIngestionService`; return `IngestAlertsResponse`
    - `POST /api/alerts/ingest`: require `X-API-Key` header matching env `API_KEY`; enqueue Celery task; return 202 Accepted
    - Support `resume_from_last` on partial batch failure (track last successful `external_id` in `ingestion_logs`)
    - _Requirements: 13.6, 13.7_

  - [ ]* 4.5 Write property test for CAP schema validation round-trip (Property 4)
    - **Property 4: CAP Schema Validation Round-Trip**
    - Generate random valid CAP XML documents using Hypothesis composite strategies; assert parser accepts all valid docs
    - Generate structurally invalid CAP docs (missing required fields, wrong types); assert parser rejects with `ParseError`
    - **Validates: Requirements 4.1**

  - [ ]* 4.6 Write property test for alert ingestion preservation (Property 5)
    - **Property 5: Alert Ingestion Preservation**
    - Generate random `RawAlertData` payloads; ingest each; retrieve from DB; assert `raw_data == original_payload`
    - Run with 100 iterations; test with CAP, GeoJSON, and custom format payloads
    - **Validates: Requirements 4.2**

  - [ ]* 4.7 Write property test for ingestion idempotency (Requirement 13)
    - Generate random valid alert payloads; ingest same payload N times (N from 2 to 5)
    - Assert database contains exactly 1 record per unique `(source_id, external_id)` after N ingestions
    - **Validates: Requirements 13.1, 13.2**

- [x] 5. Checkpoint — backend foundation
  - Ensure all backend tests pass: `pytest backend/` with no failures
  - Verify migrations apply cleanly: `alembic upgrade head` on a fresh DB
  - Confirm `POST /api/alerts/ingest` → Celery task → DB upsert roundtrip works end-to-end
  - Ask the user if questions arise before proceeding.

- [x] 6. Implement Crisis Mode text-only page
  - [x] 6.1 Create `src/app/crisis/page.tsx` as a Next.js Server Component
    - Fetch active alerts server-side via direct DB query (or internal API call) — no client-side fetch
    - Render `MinimalAlert[]` as a semantic `<ol>` of `<article>` elements with severity, headline, instruction, areas, freshness status, and provenance classification
    - Order alerts by severity descending (`extreme` first), then by `effective` descending
    - _Requirements: 7.1, 7.5, 3.1_

  - [x] 6.2 Apply inline CSS only — zero external resources on crisis page
    - Define all styles as a `<style>` tag in `<head>` using a template literal; no `<link>` tags, no external fonts, no images
    - Use high-contrast palette: `#000000` background / `#FFFFFF` text for default; severity accent via `border-left` color
    - Verify rendered HTML contains no `src` or `href` pointing to external origins using a snapshot test
    - _Requirements: 7.3, 7.6, 7.2_

  - [x] 6.3 Add ARIA landmarks, skip links, and semantic structure to crisis page
    - Wrap page in `<main role="main" aria-label="Active Alerts">` with `<header>`, `<nav aria-label="Skip links">`, and `<footer>`
    - Add `<a href="#alert-list" class="skip-link">Skip to alerts</a>` as first child of `<body>`
    - Each `<article>` must have `aria-labelledby` pointing to its headline `<h2>` and `role="article"`
    - _Requirements: 4.7, 5.1, 5.2, 7.3_

  - [x] 6.4 Implement server-side pagination for crisis page alert list
    - Accept `?page=` query param; default page size 50; render `<nav aria-label="Pagination">` with prev/next anchor links
    - Ensure paginated responses remain under 100KB total compressed payload at page boundaries
    - _Requirements: 3.4, 3.5, 7.2_

  - [ ]* 6.5 Write property test for crisis mode payload size (Property 1)
    - **Property 1: Crisis Mode Payload Size Constraint**
    - Generate random `MinimalAlert[]` arrays of size 0–50 with varying text lengths using fast-check
    - Call the crisis page server render function; measure `Buffer.byteLength(gzip(html))` for each generated set
    - Assert payload < 100KB for all generated inputs
    - **Validates: Requirements 7.2**

  - [ ]* 6.6 Write unit tests for crisis page rendering
    - Test: empty alert list renders "No active alerts" message with appropriate ARIA live region
    - Test: alerts render in severity-descending order
    - Test: rendered HTML contains no external `<link>` or external `src` attributes
    - _Requirements: 7.1, 7.3_

- [x] 7. Implement provenance badge components
  - [x] 7.1 Create `src/components/SourceBadge.tsx` component
    - Render badge with `classification` (`official` → blue + checkmark, `community` → gray + info icon) using SVG icons inline (no external icon font)
    - Apply border color for verification level: `verified` → green, `unverified` → yellow, `suspicious` → red + warning SVG
    - Use distinct visual patterns (not color alone): `official` uses solid fill, `community` uses outlined/dashed border
    - Include `aria-label` describing full source trust status (e.g., `"Official source — verified"`)
    - _Requirements: 1.1, 1.3, 1.4, 6.7_

  - [x] 7.2 Integrate `SourceBadge` into crisis page and alert detail views
    - Position badge in top 25% of each alert card's vertical space (use `order` CSS or absolute positioning within card)
    - Render badge in server-side HTML on crisis page (no JS required for visibility)
    - Add expandable verification detail panel triggered by a `<details>/<summary>` element (JS-free expand)
    - _Requirements: 1.2, 1.6, 1.5_

  - [ ]* 7.3 Write property test for provenance badge presence (Property 2)
    - **Property 2: Provenance Badge Presence**
    - Generate random `Alert` objects with varying `source.classification` values using fast-check
    - Render each alert through crisis page and detail view; parse output HTML; assert badge element with correct classification text is present
    - **Validates: Requirements 1.1, 3.1**

  - [ ]* 7.4 Write property test for provenance round-trip (Requirement 1 PBT criterion)
    - Generate random `SourceProvenance` objects; serialize to JSON; deserialize; assert `classification` and `verificationLevel` are identical
    - **Validates: Requirements 1 (property-based criterion)**

- [x] 8. Implement MapLibre GL JS map view
  - [x] 8.1 Create `src/components/MapView.tsx` client component with MapLibre initialization
    - Dynamically import `maplibre-gl` using `next/dynamic` with `ssr: false`; initialize map with OpenStreetMap raster tiles
    - Pass `MapViewProps` (see design): `alerts: GeoJSONFeatureCollection`, `userLocation?`, `selectedAlertId?`, `onAlertSelect`, `offlineMode`
    - Add severity-based fill-color paint expression: extreme → `#DC2626`, severe → `#EA580C`, moderate → `#CA8A04`, minor → `#16A34A`
    - _Requirements: 2.1, 2.2_

  - [x] 8.2 Implement accessible keyboard controls on the map
    - Arrow keys → `map.panBy([±50, ±50])`; `+`/`-` → `map.zoomIn()`/`map.zoomOut()`; `Tab` → cycle focused alert feature
    - Maintain `userInteractionMode` state (`'pan' | 'keyboard-navigate'`); announce mode changes via ARIA live region
    - Add `aria-label` to map container: `"Interactive alert map. Use arrow keys to pan, plus and minus to zoom, Tab to cycle through alerts."`
    - _Requirements: 4.1, 4.3, 17.6_

  - [x] 8.3 Add focus management and screen reader support for map alerts
    - Each alert polygon layer: add `featureState` for focus; render a `<div role="option">` in a visually-hidden list mirroring map features for screen readers
    - On `Tab` key, move `aria-activedescendant` to next alert in the list and call `map.flyTo` center of feature
    - Announce selected alert details via `aria-live="polite"` region: event type, severity, headline
    - _Requirements: 5.6, 17.1, 17.5_

  - [x] 8.4 Create `src/app/map/page.tsx` integrating `MapView` and `AlertDetailsPanel`
    - Client page: fetch alerts via SWR from `GET /api/alerts?bbox=...` (update bbox on map move with debounce 500ms)
    - Manage `selectedAlertId` state; pass to both `MapView` and `AlertDetailsPanel`
    - Implement responsive layout: sidebar panel on `md+` breakpoints, full-screen modal on mobile
    - _Requirements: 2.2, 23.1, 23.2_

  - [ ]* 8.5 Write unit tests for MapView keyboard controls
    - Test Tab cycles focus through alert features in severity order
    - Test keyboard panning triggers map pan calls
    - Test ARIA live region announces selected alert headline
    - _Requirements: 4.3, 5.5_

- [x] 9. Implement Alert Details Panel
  - [x] 9.1 Create `src/components/AlertDetailsPanel.tsx`
    - Render full `Alert` details: headline `<h2>`, description, instruction, `SourceBadge`, geometry area text list, effective/expires timestamps in both UTC and local time
    - Show staleness indicator using `calculateFreshness()`: fresh → green dot + "Current", aging → yellow dot + "Aging (Xmin old)", stale → red dot + "Stale (Xhr old)"
    - Include action buttons: "Dismiss" (Escape-key equivalent), "Download GeoJSON", "Share" (Web Share API with fallback copy-to-clipboard)
    - _Requirements: 2.3, 2.5, 17.3, 17.4_

  - [x] 9.2 Implement focus trap and modal accessibility for AlertDetailsPanel
    - On panel open: move focus to first interactive element (`<button aria-label="Close alert details">`)
    - Trap Tab/Shift+Tab within panel while open; Escape closes and returns focus to triggering element
    - Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to alert headline `<h2>`
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 9.3 Write unit tests for AlertDetailsPanel
    - Test focus moves to close button on open
    - Test Escape key closes panel and returns focus to trigger
    - Test freshness indicator text matches `calculateFreshness()` output for fresh/aging/stale alerts
    - _Requirements: 4.4, 4.5, 4.6_

- [x] 10. Implement temporal freshness rendering
  - [x] 10.1 Create `src/components/FreshnessIndicator.tsx`
    - Accept `effectiveTime: ISO8601Timestamp` and `expiresTime: ISO8601Timestamp`
    - Call `calculateFreshness(effectiveTime)` and map to: `fresh` → `aria-label="Status: Current"`, `aging` → `aria-label="Status: Aging"`, `stale` → `aria-label="Status: Stale — information may be outdated"`
    - Use text labels + icons (not color alone): fresh → ✓, aging → ⚠, stale → ✕ using inline SVG
    - Display `lastUpdated` in both UTC (`toISOString()`) and locale time (`toLocaleString()`)
    - _Requirements: 2.3, 2.4, 2.5, 6.7_

  - [x] 10.2 Integrate `FreshnessIndicator` into crisis page, detail panel, and map popup
    - Crisis page: render freshness status as text in each `<article>` (`<span aria-label="...">`)
    - Detail panel: render indicator in top 150px of the alert detail view per design spec
    - Map popup: include freshness text in `maplibregl.Popup` content
    - _Requirements: 2.2, 2.3, 5.2_

  - [ ]* 10.3 Write property test for freshness state calculation (Property 6)
    - **Property 6: Freshness State Calculation**
    - Generate random timestamps at ages 0–300 minutes using `fc.integer({ min: 0, max: 300 })`
    - Assert: age < 60 → `fresh`; 60 ≤ age < 120 → `aging`; age ≥ 120 → `stale`
    - Assert monotonic transitions: incrementing age never skips directly from `fresh` to `stale`
    - **Validates: Requirements 2.1, 5.1**

  - [ ]* 10.4 Write property test for freshness indicator rendering (Property 7)
    - **Property 7: Freshness Indicator Rendering**
    - Generate random `Alert` objects with varying `effective` timestamps using fast-check
    - Render `FreshnessIndicator` for each; parse output; assert `aria-label` contains the correct state word matching `calculateFreshness()` result
    - **Validates: Requirements 5.2**

- [ ] 11. Checkpoint — frontend core
  - Run `vitest --run` and confirm all unit and property tests pass
  - Verify crisis page server render: `next build` succeeds; page HTML is valid and has no external resource refs
  - Check `FreshnessIndicator` shows correct state across all three freshness zones
  - Ask the user if questions arise before proceeding.

- [ ] 12. Implement Service Worker and offline resilience
  - [ ] 12.1 Set up Workbox in Next.js using `next-pwa` or manual Workbox webpack plugin
    - Configure Workbox in `next.config.ts`: enable in production; set `swDest: 'public/sw.js'`
    - Register SW in `src/app/layout.tsx` via `<Script>` with `strategy="afterInteractive"`
    - _Requirements: 8.4_

  - [ ] 12.2 Implement caching strategies matching the design spec
    - Cache-first for static assets (`*.js`, `*.css`, `*.woff2`, `*.svg`) with 30-day expiry, max 100 entries
    - Network-first for `/api/alerts*` with 3-second network timeout, 2-hour expiry, max 50 entries
    - Cache-first for OpenStreetMap tile URLs (`*.tile.openstreetmap.org`) with 7-day expiry, max 500 entries
    - _Requirements: 6.1, 8.4_

  - [ ] 12.3 Implement IndexedDB schema and access layer in `src/lib/offline-db.ts`
    - Use `idb` library; define `geoalert-offline` database version 1 with stores: `alerts` (keyPath: `id`), `settings` (keyPath: `key`), `syncQueue` (keyPath: `id`, autoIncrement)
    - Export `getOfflineAlerts()`, `putOfflineAlert(alert)`, `clearOfflineAlerts()`, `queueSync(task)`, `processSyncQueue()`
    - _Requirements: 8.2, 8.3, 8.6, 8.7_

  - [ ] 12.4 Implement `OfflineIndicator` component and online/offline detection
    - Create `src/components/OfflineIndicator.tsx` accepting `OfflineIndicatorProps` (see design)
    - Use `window.navigator.onLine` + `online`/`offline` event listeners in a custom hook `useOnlineStatus()`
    - Show banner: "You are offline. Showing cached alerts from [lastSyncTime]." with `role="status"` and `aria-live="polite"`
    - When back online: show "Connection restored — syncing..." and trigger `processSyncQueue()`
    - _Requirements: 8.5, 6.2, 26.5_

  - [ ] 12.5 Implement offline package download (incident package)
    - Add "Download Offline Package" button in map view and crisis page header
    - On click: fetch current viewport alerts + metadata → serialize to JSON → include `downloadedAt` and `expiresAt` (24h) timestamps → save to IndexedDB `settings` store as `offline_package`
    - Include `schemaVersion: 1` in package for future migration support
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

  - [ ]* 12.6 Write integration tests for offline behavior
    - Test: load page online → go offline → reload → `OfflineIndicator` visible → alerts still rendered from IndexedDB
    - Test: clear offline data button removes IndexedDB entries and shows empty state
    - _Requirements: 8.5, 8.6_

- [ ] 13. Implement Accessibility Toolbar and WCAG 2.2 AA compliance
  - [ ] 13.1 Create `src/components/A11yToolbar.tsx`
    - Render controls: high contrast toggle, text scale selector (100/150/200/300/400%), screen reader optimized mode toggle, reduced motion toggle
    - Persist preferences to `localStorage` under key `geoalert-a11y-prefs`; rehydrate on mount
    - Apply preferences via CSS custom properties on `<html>` element (`--text-scale`, `--color-scheme`)
    - _Requirements: 6.3_

  - [ ] 13.2 Apply WCAG 2.2 AA color contrast and visual standards globally
    - Audit and update Tailwind color palette: all text/background combinations must meet 4.5:1 (normal text) and 3:1 (large text/UI) contrast ratios
    - Add `:focus-visible` styles with 3:1 contrast ratio outline (e.g., `outline: 3px solid #005FCC`) to all interactive elements
    - Ensure all touch targets ≥ 44×44px; add `min-h-[44px] min-w-[44px]` utility classes where needed
    - _Requirements: 4.2, 6.5, 6.6_

  - [ ] 13.3 Implement 400% zoom and responsive layout compliance
    - Verify `src/app/globals.css` sets `font-size: 16px` on body and uses `rem` units throughout
    - Test all page layouts at 320px viewport width (equivalent to 400% zoom on 1280px screen) — no horizontal scroll on `main` content
    - Adjust `MapView` to use `flex-col` stacking at narrow viewports; sidebar becomes bottom sheet
    - _Requirements: 6.1, 6.2, 6.4, 23.5_

  - [ ] 13.4 Implement ARIA live regions for dynamic alert updates
    - Add `<div aria-live="polite" aria-atomic="false" className="sr-only" id="alert-announcer">` to root layout
    - Wire to a `useAlertAnnouncer()` hook that pushes messages when new alerts are fetched, SW sync completes, or map selection changes
    - _Requirements: 5.5_

  - [ ]* 13.5 Write property test for ARIA landmark completeness (Property 8)
    - **Property 8: ARIA Landmark Completeness**
    - Generate random page states (varying alert counts, selected alert, online/offline) using fast-check
    - Render each page state with React Testing Library; query DOM; assert presence of `role="main"`, `role="navigation"`, `role="banner"`; assert all `<button>` and `<a>` elements have accessible names
    - **Validates: Requirements 5.1, 7.1**

- [ ] 14. Implement privacy controls
  - [ ] 14.1 Implement coarse location service in `src/lib/location.ts`
    - `getBrowserLocation()`: call `navigator.geolocation.getCurrentPosition`; round coordinates to 2 decimal places (≈1km precision) before any use
    - `toCoarseLocation(coords)`: reverse-geocode using a privacy-respecting service (e.g., Nominatim) or return `{ region, country }` from rounded coords only — never log or transmit precise GPS coordinates
    - Store only `CoarseLocation` (city/region/country) in component state; never write precise coords to localStorage or send to API
    - _Requirements: 9.1, 9.2, 9.6_

  - [ ] 14.2 Implement location consent flow and privacy dashboard
    - On first visit: show consent banner explaining location usage; offer "Use approximate location", "Enter location manually", "Continue without location"
    - Manual input: text search box (`/api/geocode?q=...` proxy to Nominatim); display city-level result for confirmation before use
    - Privacy dashboard page at `/privacy`: show current location sharing status, "Clear location data" button, link to data export/deletion
    - _Requirements: 9.2, 9.5, 9.7, 10.7_

  - [ ] 14.3 Implement data export and deletion endpoints
    - `GET /api/user/export`: return JSON of all user data (alert zones, preferences, notification settings) within 60s
    - `POST /api/user/delete`: mark account `deleted_at = NOW()`; return 202; schedule background job for 30-day hard delete
    - Add confirmation dialog in UI with honest retention explanation before deletion
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 15. Implement security controls
  - [ ] 15.1 Add XSS sanitization middleware for all user text inputs
    - Backend: add Pydantic validator using `bleach.clean()` on all `str` fields in request schemas; allow empty allowed-tags list for pure-text fields
    - Frontend: never use `dangerouslySetInnerHTML` with alert content; use React's default text escaping; sanitize any HTML from `raw_data` previews with `DOMPurify` before render
    - _Requirements: 21.3_

  - [ ]* 15.2 Write property test for XSS sanitization (Requirement 21 PBT criterion)
    - **Property: Input Sanitization**
    - Generate malicious payloads: script tags (`<script>alert(1)</script>`), event handlers (`<img onerror=...>`), SQL fragments (`'; DROP TABLE--`), template injections (`{{7*7}}`)
    - Pass each through `sanitize_input()` backend function; assert output contains no `<script>` tags, no event handler attributes, no SQL metacharacters in string positions
    - **Validates: Requirements 21.3**

  - [ ] 15.3 Implement Content Security Policy headers
    - Add `next.config.ts` `headers()` returning `Content-Security-Policy` for all routes:
      `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.tile.openstreetmap.org; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'`
    - Add FastAPI middleware setting same headers on all API responses; add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
    - _Requirements: 21.6_

  - [ ] 15.4 Implement Redis-backed rate limiting on FastAPI endpoints
    - Create `backend/app/middleware/rate_limit.py` using `redis` async client with sliding window algorithm
    - Read endpoints: 100 req/min per IP; write endpoints: 10 req/min per IP; return HTTP 429 with `Retry-After` header on violation
    - Exempt requests with valid `X-Admin-Key` header from limits
    - Log violations with client IP and endpoint to structured logger
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ] 15.5 Implement WebAuthn passkey authentication endpoints
    - Add `POST /api/auth/register/begin`, `POST /api/auth/register/complete`, `POST /api/auth/login/begin`, `POST /api/auth/login/complete` using `py-webauthn` library
    - Store only WebAuthn credential IDs and public keys — no passwords
    - Implement RBAC: `public`, `registered_user`, `administrator` roles; protect `/api/alerts/ingest` and `/api/admin/*` with role checks
    - Session: JWT with 24h expiry for users, 1h for admins; rotate on each request
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 16. Implement provider health monitoring and admin dashboard
  - [ ] 16.1 Implement provider health metrics collection
    - Update `AlertIngestionService` to write to `ingestion_logs` on every fetch: `last_successful_fetch`, validation failure count, duplicate count
    - Add `backend/app/services/health_monitor.py`: compute `uptime_percentage` over rolling 30-day window; compute `error_rate` percentage; check if `error_rate > 10%` and enqueue admin notification
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_

  - [ ] 16.2 Implement `GET /api/admin/dashboard` endpoint
    - Return: provider health status array, alert counts by severity, API request rate (from Redis counters), Redis cache hit rate, DB connection pool status
    - Protect with `administrator` role JWT; 401 for unauthenticated, 403 for insufficient role
    - _Requirements: 12.5, 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_

  - [ ] 16.3 Create `src/app/admin/page.tsx` admin dashboard UI
    - Server component fetching dashboard data from `GET /api/admin/dashboard`; redirect to login if unauthenticated
    - Display provider cards with uptime %, last fetch time, error rate, alert counts by severity
    - Add `<meta http-equiv="refresh" content="30">` for auto-refresh (JS-free fallback); also implement client-side SWR with 30s `refreshInterval`
    - _Requirements: 25.7_

- [ ] 17. Implement remaining API features and data layer
  - [ ] 17.1 Implement full-text alert search endpoint
    - `GET /api/alerts/search?q=&from=&to=&severity=&category=&page=` using PostgreSQL `tsvector` + `tsquery` on `headline || description`
    - Return results within 500ms p95; paginate at 25/page; include `highlight` field with `ts_headline()` markup
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7_

  - [ ] 17.2 Implement notification preferences storage
    - `GET/PUT /api/user/notification-preferences`: store up to 5 alert zones with radius, min severity, category filters, and channel opt-ins (push/email/SMS)
    - Non-authenticated users: store preferences in browser `localStorage` under `geoalert-notif-prefs`; merge with server prefs on sign-in
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.6, 16.7_

  - [ ] 17.3 Implement error handling middleware and circuit breakers
    - FastAPI exception handlers: `RequestValidationError` → 422 with field-level errors; `HTTPException` passthrough; unhandled → 500 with `requestId` (UUID generated per request)
    - Add `circuitbreaker` library wrapper around external source feed fetches: open after 5 failures, half-open after 60s
    - Frontend: SWR `onError` handler → show `OfflineIndicator` style banner with "Retry" button; log to Sentry
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6_

- [ ] 18. Implement OpenAPI documentation and multilingual scaffolding
  - [ ] 18.1 Generate and expose OpenAPI 3.1 documentation
    - FastAPI auto-generates OpenAPI from type annotations; add `summary`, `description`, `response_model`, and `tags` to all route decorators
    - Add `responses` dict with `422`, `429`, `500` schemas on all routes; add `SecurityScheme` for bearer JWT and API key
    - Expose at `/api/docs` (Swagger UI) and `/api/openapi.json`
    - _Requirements: 28.1, 28.2_

  - [ ] 18.2 Set up FormatJS (react-intl) internationalization infrastructure
    - Install `react-intl`; wrap root layout in `<IntlProvider locale={locale} messages={messages}>`
    - Extract all UI strings to `src/messages/en.json`; create stub `es.json` with same keys (empty values)
    - Add locale detector from `Accept-Language` header in Next.js middleware; add language selector component in nav
    - _Requirements: 18.1, 18.2, 18.4_

- [ ] 19. Set up CI/CD pipeline
  - [ ] 19.1 Create GitHub Actions workflow for frontend
    - File: `.github/workflows/frontend.yml`; trigger on push/PR to `main`
    - Steps: `npm ci` → ESLint + TypeScript type-check → `vitest --run --coverage` (fail if coverage < 70%) → `next build`
    - Upload coverage report as artifact; post coverage summary to PR as comment using `actions/github-script`
    - _Requirements: 29.2, 29.6, 30.5_

  - [ ] 19.2 Create GitHub Actions workflow for backend
    - File: `.github/workflows/backend.yml`; trigger on push/PR to `main`
    - Steps: `pip install -r requirements.txt` → `ruff check` + `mypy` → `pytest --cov=app --cov-fail-under=80` → Alembic migration check (`alembic check`)
    - _Requirements: 29.1, 29.6_

  - [ ] 19.3 Create GitHub Actions workflow for integration and accessibility tests
    - File: `.github/workflows/integration.yml`; trigger on push/PR to `main` after frontend + backend pass
    - Steps: spin up PostgreSQL + PostGIS + Redis as services → `alembic upgrade head` → start FastAPI test server → `npx playwright test` → run `axe-core` accessibility audit on crisis page, map page, admin page
    - Fail build if any Playwright test fails or if axe audit finds critical/serious violations
    - _Requirements: 29.3, 29.4, 29.5, 29.6_

  - [ ] 19.4 Add Lighthouse CI performance budget check
    - Install `@lhci/cli`; create `lighthouserc.json` with assertions: `first-contentful-paint < 2000`, `interactive < 3000`, `accessibility >= 0.9`, `best-practices >= 0.9`
    - Add Lighthouse CI step to integration workflow after Playwright tests
    - Fail build if accessibility score < 90 or performance regression > 10%
    - _Requirements: 27.2, 29.5_

- [ ] 20. Final checkpoint — full integration
  - Run complete test suite: `vitest --run`, `pytest`, `npx playwright test`
  - Verify all 10 correctness properties have passing property tests
  - Confirm crisis page payload < 100KB with 50 mock alerts
  - Verify CI workflows pass on a clean branch
  - Ask the user if questions arise before proceeding.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core functionality remains intact without them
- Each task references specific requirements for traceability to `requirements.md`
- Property tests (Properties 1–10) correspond exactly to the Correctness Properties section in `design.md`
- The `calculateFreshness` function (Task 1.4) is the single source of truth used by both backend staleness marking and frontend `FreshnessIndicator`
- Backend uses Python/FastAPI; frontend uses TypeScript/Next.js 14+ App Router — no pseudocode was used in the design, so no language selection is needed
- Checkpoints (Tasks 5, 11, 20) are natural gates between backend foundation, frontend core, and full integration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "3.1"] },
    { "id": 4, "tasks": ["2.5", "2.6", "3.2", "4.1", "4.2"] },
    { "id": 5, "tasks": ["3.3", "4.3"] },
    { "id": 6, "tasks": ["4.4", "4.5", "4.6", "4.7"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3", "6.4", "7.1"] },
    { "id": 9, "tasks": ["6.5", "6.6", "7.2"] },
    { "id": 10, "tasks": ["7.3", "7.4", "8.1"] },
    { "id": 11, "tasks": ["8.2", "8.3", "9.1"] },
    { "id": 12, "tasks": ["8.4", "8.5", "9.2", "10.1"] },
    { "id": 13, "tasks": ["9.3", "10.2"] },
    { "id": 14, "tasks": ["10.3", "10.4", "12.1"] },
    { "id": 15, "tasks": ["12.2", "12.3", "13.1", "13.2"] },
    { "id": 16, "tasks": ["12.4", "12.5", "13.3", "13.4", "14.1"] },
    { "id": 17, "tasks": ["12.6", "13.5", "14.2", "15.1"] },
    { "id": 18, "tasks": ["14.3", "15.2", "15.3", "15.4", "15.5"] },
    { "id": 19, "tasks": ["16.1"] },
    { "id": 20, "tasks": ["16.2", "17.1", "17.2"] },
    { "id": 21, "tasks": ["16.3", "17.3", "18.1", "18.2"] },
    { "id": 22, "tasks": ["19.1", "19.2"] },
    { "id": 23, "tasks": ["19.3"] },
    { "id": 24, "tasks": ["19.4"] }
  ]
}
```
