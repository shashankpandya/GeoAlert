# GeoAlert 2.0 — Comprehensive Website Improvement Plan

## 1. Important audit note

I cannot directly browse or inspect `https://geoalert-natural-events-hub.vercel.app/` in this environment. Therefore:

- I have **not verified** the current interface, source code, accessibility, APIs, performance, or mobile behavior.
- Statements that the current site is crowded or difficult to use are treated as **reported observations**, not independently confirmed findings.
- The first project activity must be a documented audit of the deployed application and repository.
- “Perfect” cannot be guaranteed for safety-critical software. The practical goal is a system that is **measurably safer, simpler, accessible, reliable, and continuously validated**.

---

# 2. Product direction

GeoAlert should not feel like a large monitoring dashboard designed for specialists. It should answer a small number of urgent questions:

1. **Am I currently in danger?**
2. **Is this warning official?**
3. **What should I do now?**
4. **Where is the affected area?**
5. **How current is the information?**
6. **What can I do if internet access fails?**

The default interface should show only information needed to answer those questions. Technical data, projections, historical charts, and secondary tools should remain available through progressive disclosure.

## Core design principles

1. **Official instructions first**
2. **Actions before analytics**
3. **List and text views before map dependence**
4. **Plain language before technical terminology**
5. **Freshness and provenance always visible**
6. **No color-only communication**
7. **Local-first privacy**
8. **Works on small screens and slow networks**
9. **Graceful failure rather than false certainty**
10. **Research features clearly separated from production features**

---

# 3. Phase 0: Audit the existing application

Before redesigning anything, establish an evidence-based baseline.

## 3.1 UX audit

Test at least these journeys:

- Find active hazards near a location.
- Determine whether an alert is official.
- Understand severity and urgency.
- Open an event and find instructions.
- Browse without sharing precise location.
- Create an alert zone.
- Download information for offline use.
- Use the site during a simulated network outage.
- Switch language and text direction.
- Find emergency telephone alternatives.
- Delete stored information.

Document for each journey:

- Completion rate;
- Time to completion;
- Number of interactions;
- Navigation errors;
- Misinterpretations;
- Abandonment points;
- Accessibility barriers;
- Unnecessary content;
- Missing safety information.

## 3.2 Accessibility audit

Use automated and manual methods.

### Automated

- Axe;
- Playwright accessibility tests;
- Lighthouse;
- HTML validation;
- Color-contrast testing;
- ESLint accessibility rules.

### Manual

- Keyboard-only navigation;
- VoiceOver on iOS and macOS;
- TalkBack on Android;
- NVDA with Firefox or Chrome;
- 200% and 400% zoom;
- High-contrast and forced-colors modes;
- Reduced motion;
- Switch-control simulation;
- RTL layouts;
- Landscape and portrait orientation;
- Simple-language mode;
- Touch targets with limited motor precision.

The audit report must distinguish:

- Critical blockers;
- WCAG 2.2 AA failures;
- Usability concerns;
- Enhancements targeting applicable AAA criteria.

## 3.3 Performance audit

Capture:

- JavaScript and CSS bundle sizes;
- Server response time;
- Largest Contentful Paint;
- Interaction to Next Paint;
- Cumulative Layout Shift;
- Map initialization cost;
- Number and size of network requests;
- Third-party requests;
- Performance on low-end Android hardware;
- Slow 3G and intermittent network behavior;
- No-JavaScript rendering;
- Service-worker and offline behavior.

## 3.4 Data and safety audit

For every visible alert, identify whether the site displays:

- Provider;
- Official or non-official classification;
- Source link or identifier;
- Issued time;
- Last updated time;
- Expiration;
- Coverage area;
- Severity;
- Urgency;
- Certainty;
- Verification status;
- Simulation or test status;
- Licensing restrictions;
- Instructions;
- Staleness warnings.

Any alert lacking provenance must be treated as unverified until corrected.

## 3.5 Security and privacy audit

Review:

- Authentication;
- Cookies and tracking;
- Location collection;
- Analytics;
- API authorization;
- Rate limiting;
- Cross-site scripting exposure;
- CSRF protection;
- Content Security Policy;
- Secret management;
- Dependency vulnerabilities;
- Database access;
- Logging of precise locations;
- Account deletion;
- Data export;
- Backup handling;
- Service-worker cache leakage;
- IndexedDB storage of sensitive information.

## Audit deliverable

Produce a versioned report containing:

```text
Finding ID
Evidence
Affected page or component
Severity
Safety impact
Accessibility impact
Recommended correction
Owner
Target release
Verification method
Status
```

---

# 4. New information architecture

The application should have a small and predictable top-level structure.

## Primary navigation

1. **Alerts**
2. **Near Me**
3. **Prepare**
4. **Resources**
5. **Saved**
6. **Settings**

Administration, provider health, research models, and developer tools must not appear in the public primary navigation.

## Emergency shortcut

A persistent but non-obstructive **Emergency Mode** control should be available from every page.

It opens a lightweight interface containing:

- Current highest-priority official alert;
- Immediate official instructions;
- Call-emergency-services option where appropriate;
- “I cannot call” accessibility alternative;
- Saved contacts;
- Downloaded incident information;
- Location-sharing status;
- Connectivity status;
- Last successful synchronization time.

The shortcut must not automatically contact emergency services or claim to send an SOS unless that channel is verifiably integrated.

---

# 5. Homepage redesign

The current homepage should be replaced with a calm, task-oriented layout.

## 5.1 Header

Include only:

- GeoAlert logo and name;
- Language selector;
- Accessibility preferences;
- Connectivity indicator;
- Emergency Mode button;
- Compact menu on small screens.

Avoid:

- Large navigation menus;
- Scrolling tickers;
- Multiple competing notification badges;
- Decorative animation;
- Automatically rotating carousels;
- Technical provider names in primary navigation.

## 5.2 Primary status card

The first content element should summarize the user’s situation without requiring a map.

Example:

> **No active official warnings found for your selected area**  
> Last checked 2 minutes ago using three official sources.  
> Location precision: approximate city-level location.

Or:

> **Extreme flood warning — act now**  
> Official warning issued by [Authority] at 14:20 local time.  
> Your saved alert zone intersects the warning area.

Actions:

- Read official instructions;
- View affected area;
- Download for offline use;
- Share;
- Change location.

Do not use reassuring phrases such as “You are safe.” Absence of known alerts is not proof of safety.

## 5.3 Active alerts

Show a concise list, ordered by:

1. Official status;
2. Direct intersection with the selected area;
3. Severity;
4. Urgency;
5. Freshness.

Each card should include:

- Hazard name;
- Official/non-official label;
- Severity and urgency in text;
- Affected area;
- Issued and updated times;
- Freshness;
- Short instruction;
- “View details” action.

Initially show no more than three items. Provide a clear “View all alerts” link.

## 5.4 Secondary content

Preparedness, historical events, climate information, volunteer tools, and educational material should appear after current alerts and be visually separated from live emergency information.

---

# 6. Alerts page

Provide three synchronized views:

- **Accessible list view** — default;
- **Map view**;
- **Compact table view** for professional users.

The map must never be the only way to access information.

## Filters

Start with only essential filters:

- Location;
- Active/expired;
- Hazard type;
- Severity;
- Official/community/model/simulation;
- Date range.

Advanced filters should be collapsed by default.

The interface must display active filters as removable chips and provide a single “Clear all filters” control.

## Alert-card design

Every card must show:

```text
Hazard type
Official status
Severity
Urgency
Affected area
Issued time
Updated time
Expiration or “No expiration supplied”
Provider
Short instruction
```

Color can reinforce severity, but text, iconography, and patterns must communicate the same meaning.

---

# 7. Event-detail page

Every hazard should have a stable, server-rendered, shareable public URL that works without JavaScript.

## Recommended content order

### 1. Alert identity

- Hazard name;
- Official/model/community/simulation classification;
- Severity;
- Urgency;
- Certainty;
- Actual/test/exercise status.

### 2. Immediate instructions

Use exact instructions from the official source where legally and technically allowed. Clearly distinguish source text from GeoAlert summaries.

### 3. Timing and freshness

Display dates in local time and provide an option to reveal UTC.

Include:

- Issued;
- Updated;
- Effective from;
- Expires;
- Ingested;
- “Data is stale” warning when applicable.

Avoid vague labels such as “recently.”

### 4. Area affected

Provide:

- Plain-language area names;
- Accessible text description;
- Map;
- Coordinates and geometry download for technical users.

### 5. Source and provenance

Include:

- Organization;
- Source classification;
- External identifier;
- Source URL;
- License;
- Verification status;
- Normalization operations;
- Correction or supersession history.

### 6. Recommendations

Separate content into:

- **Official instructions**
- **GeoAlert preparedness guidance**
- **Experimental projections**

Each section must have a visually and semantically distinct label.

### 7. Alternatives and limitations

Explain missing information and provide non-digital alternatives, such as local radio or emergency telephone numbers, where verified.

---

# 8. Map redesign

The map should support comprehension rather than dominate the application.

## Map requirements

- MapLibre rather than proprietary domain coupling;
- Keyboard-operable controls;
- Visible focus indicators;
- Text alternatives;
- List synchronized with map results;
- Clustering at low zoom levels;
- Pattern and border differences in addition to color;
- High-contrast basemap;
- Reduced-motion mode;
- Layer descriptions;
- “Fit to alert” action;
- Reset orientation;
- Scale bar and legend;
- Current timestamp;
- Clear differentiation between observed and projected geometry.

## Layer hierarchy

1. Official active alerts;
2. User’s selected or saved area;
3. Verified closures and exclusion zones;
4. Verified shelters and resources;
5. Community reports;
6. Experimental projections;
7. Historical and educational data.

Experimental layers must be disabled by default during crisis mode.

## Map safety rules

- Never display a route as “safe.”
- Use wording such as “route avoids currently known exclusion zones.”
- Show the route-generation timestamp.
- Disable route generation when necessary data is stale or unavailable.
- Never infer shelter availability from the presence of a shelter marker.
- Show “capacity unknown” unless verified capacity data exists.

---

# 9. Crisis Mode

Crisis Mode should be a separate lightweight experience, not merely a dark theme.

## Characteristics

- Under 100 KB compressed for the core text experience where feasible;
- Server-rendered;
- Minimal JavaScript;
- No heavy map loaded initially;
- Large touch targets;
- Plain language;
- High contrast;
- Reduced animation;
- Critical content first;
- Offline availability;
- Read-only fallback;
- Clear stale-data indicators.

## Crisis Mode navigation

1. What is happening?
2. What should I do?
3. Where does it apply?
4. Contact help;
5. Saved people and plans;
6. Offline information;
7. Source and update time.

If network access fails, show:

> You are viewing information saved at 14:32 local time. Conditions may have changed. Check local authorities, radio, or emergency services when possible.

---

# 10. Accessibility and inclusive design

## 10.1 Semantic structure

Use:

- Native headings in order;
- `<nav>`, `<main>`, `<article>`, `<aside>`, and `<footer>`;
- Buttons for actions;
- Links for navigation;
- Tables only for tabular data;
- Fieldsets and legends for grouped form controls;
- Live regions only for genuinely important updates.

Avoid adding redundant ARIA to native elements.

## 10.2 Visual accessibility

- Body text at least 16 px;
- Comfortable line height;
- Text line length around 45–80 characters;
- WCAG 2.2 AA contrast;
- Visible keyboard focus;
- No text embedded only in images;
- No flashing content;
- No important information dependent on hover;
- Minimum 44×44 CSS-pixel touch targets where applicable;
- Support for browser text enlargement and 400% zoom.

## 10.3 Cognitive accessibility

Provide an optional simple mode with:

- Shorter sentences;
- One action per section;
- Familiar icons paired with text;
- Reduced number of choices;
- Definitions of terms such as “urgency” and “certainty”;
- No unexplained acronyms;
- Consistent button labels.

Do not let generated simplification alter official instructions without showing the original text and clearly labeling the simplified version.

## 10.4 Hearing, speech, and motor needs

- Transcripts and captions for all media;
- No audio-only warnings;
- Visual and vibration alternatives in native applications;
- Keyboard and switch compatibility;
- No drag-only interactions;
- Non-voice emergency options where verified;
- Adjustable time limits;
- Confirmation for destructive actions.

## 10.5 Internationalization

Build internationalization into the design system from the start:

- RTL-aware layout;
- Locale-aware date, time, number, and unit formatting;
- Language metadata;
- Text expansion testing;
- Translation status;
- Fallback-language warning;
- Human review for safety-critical translations;
- Original official text available when translations are unofficial.

Do not use national flags as language selectors.

---

# 11. Alert provenance and trust design

Every alert should carry a highly visible source badge:

- **Official**
- **Verified partner**
- **Community report**
- **Experimental model**
- **Simulation/test**

These classifications must not rely on color alone.

## Conflict handling

When sources disagree:

- Do not silently merge contradictory instructions.
- Display the disagreement.
- Give official authorities precedence.
- Preserve source-specific timestamps.
- Explain which source was used for prominent recommendations.
- Allow users to inspect both records.
- Record merge and supersession decisions in lineage.

## Stale information

Recommended states:

- Fresh;
- Aging;
- Stale;
- Expired;
- Update failed.

The thresholds should be provider- and hazard-specific rather than universal.

---

# 12. ThreatScore presentation

ThreatScore must not appear more authoritative than official hazard classifications.

## Display requirements

- Label it “GeoAlert decision-support score.”
- Show the formula version.
- Display all contributing factors.
- Show missing data.
- Allow optional local factors to be removed.
- Include an uncertainty range.
- Explain that it is not an official warning.
- Compute sensitive household factors locally where practical.
- Never reduce service priority based on protected demographic characteristics.

Example:

> **Decision-support score: 82/100 — Very High**  
> Estimated range: 74–88  
> This is not an official risk classification.

The score should be hidden when insufficient data makes it misleading.

---

# 13. Privacy improvements

## Default behavior

- No account required for public alerts;
- No precise location stored on the server by default;
- Alert zones stored locally;
- Approximate location option;
- Manual place selection;
- Separate consent for notifications;
- Separate consent for analytics;
- No location in application logs;
- No advertising trackers;
- No sale of personal information.

## Privacy dashboard

Users should be able to see:

- What is stored on the device;
- What is stored on the server;
- Which permissions are active;
- Last synchronization;
- Registered devices;
- Notification subscriptions;
- Export data;
- Delete local data;
- Delete account and server data.

Deletion should be a clear, one-action workflow with confirmation and an honest explanation of legally required retention.

## Authentication

Use passkeys for optional accounts. Provide safe account recovery without making unverifiable “zero-knowledge” claims.

---

# 14. Offline and degraded-network behavior

## Offline incident package

Users should be able to download:

- Current alerts;
- Official instructions;
- Relevant contact numbers;
- Preparedness checklist;
- Selected geographic area;
- Small static map or vector package;
- Saved contacts;
- Resource directory;
- Data timestamp and expiration.

## Cache strategy

- Cache public page shells;
- Cache previously viewed event pages;
- Use network-first for current alerts;
- Fall back to last-known-good data;
- Never hide stale status;
- Version offline schemas;
- Test service-worker upgrades;
- Provide a “Clear downloaded data” control.

When writes fail, queue only safe, idempotent operations. Do not imply that a report or SOS has been delivered until the server confirms receipt.

---

# 15. Communication capability matrix

The website must have a visible runtime capability screen.

| Capability | Browser/PWA | Native app | Release status |
|---|---:|---:|---|
| Public alerts | Yes | Yes | Production MVP |
| Web Push | Platform-dependent | Yes | MVP/Beta |
| Offline saved alerts | Yes | Yes | MVP |
| WebRTC peer prototype | Limited; signaling required | Possible | Beta |
| BLE transport | Very limited | Platform-dependent | Native research |
| Wi-Fi Direct/Aware | Generally unavailable | Android-dependent | Native research |
| Background SOS | Not guaranteed | Restricted but possible | Partner/native |
| SMS delivery | Server/provider integration | Server/provider integration | Partner-dependent |
| Cell broadcast | No | System/operator controlled | Unavailable without partners |
| Multi-hop emergency mesh | Not reliable | Specialized native design | Research |

The PWA must never advertise itself as a guaranteed emergency mesh.

---

# 16. Technical implementation plan

## Frontend

- Next.js App Router;
- TypeScript strict mode;
- Server-rendered alert pages;
- Progressive enhancement;
- MapLibre and deck.gl loaded only when needed;
- Radix Primitives or equivalent;
- Tailwind with design tokens;
- TanStack Query;
- Zustand only for small UI state;
- Dexie for IndexedDB;
- FormatJS or Lingui;
- Playwright, Vitest, Testing Library, and Axe.

No `localStorage` or `sessionStorage`.

## Backend

- FastAPI;
- Pydantic v2;
- PostgreSQL and PostGIS;
- Redis for short-lived cache and rate limiting;
- A simple durable worker queue initially;
- OpenAPI contracts;
- Server-Sent Events for alert updates;
- Database migrations;
- Idempotent provider ingestion;
- Dead-letter queue;
- Provider health monitoring.

Kafka should be introduced only after measured throughput or ordering requirements justify it.

## Core API endpoints

```text
GET  /v1/hazards
GET  /v1/hazards/{id}
GET  /v1/hazards/{id}/lineage
GET  /v1/providers
GET  /v1/providers/{id}/health
GET  /v1/resources
GET  /v1/stream/alerts
POST /v1/alert-zone-evaluations
POST /v1/notification-subscriptions
DELETE /v1/me
GET  /v1/health/live
GET  /v1/health/ready
```

Public query endpoints should accept bbox, hazard type, status, classification, time range, severity, and pagination.

---

# 17. Security plan

Create a formal threat model covering:

- False-alert injection;
- Compromised provider feeds;
- Account takeover;
- Location inference;
- Notification abuse;
- Community-report manipulation;
- Resource-directory fraud;
- Cache poisoning;
- Service-worker compromise;
- API scraping and denial of service;
- Administrative privilege escalation;
- Supply-chain attacks;
- Insider access;
- Stolen devices.

## Minimum controls

- Strict Content Security Policy;
- HTTPS and HSTS;
- Secure cookies;
- CSRF protection where applicable;
- Input and GeoJSON validation;
- Rate limits;
- Role-based administrative access;
- Passkeys and administrator step-up authentication;
- Signed and auditable administrative actions;
- Dependency scanning;
- Secret scanning;
- SAST and DAST;
- Container scanning;
- Software bill of materials;
- Encrypted backups;
- Restore testing;
- Least-privilege database roles;
- Sensitive-data redaction;
- Incident-response runbook.

Community reports must be rate-limited, moderated, abuse-resistant, and visually subordinate to official information.

---

# 18. Observability and operations

Measure each part of the warning pipeline:

1. Source publication to ingestion;
2. Ingestion to validation;
3. Validation to normalization;
4. Normalization to database availability;
5. Database availability to fan-out;
6. Fan-out to client receipt.

## Operational dashboards

Track:

- Provider uptime;
- Last successful provider fetch;
- Schema failures;
- Duplicate rates;
- Processing lag;
- Dead-letter queue size;
- Alert freshness;
- API latency;
- Cache hit ratio;
- Notification success;
- Client offline rate;
- Error rate by release;
- Accessibility regression results.

Logs must avoid precise user locations and message content unless explicitly required and protected.

---

# 19. Delivery roadmap

## Phase 0 — Discovery and audit, 2–3 weeks

Deliver:

- Deployed-site audit;
- Repository audit;
- User interviews;
- Accessibility report;
- Performance baseline;
- Data-source inventory;
- Capability matrix;
- Threat model;
- Prioritized issue register.

## Phase 1 — Foundations, 3–4 weeks

Deliver:

- Monorepo;
- CI/CD;
- Design tokens;
- Accessible component library;
- Canonical hazard schema;
- OpenAPI contract;
- Database migrations;
- Mock provider;
- Provider health model;
- Observability baseline;
- Architecture decision records.

## Phase 2 — Vertical Slice 1: Public official alert, 3–4 weeks

Include:

- One documented live or official sandbox provider;
- Ingestion;
- Validation;
- Deduplication;
- Database storage;
- Alert-list page;
- Event-detail page;
- Provenance;
- No-JavaScript support;
- Accessibility tests;
- Security tests;
- Deployment;
- Operational dashboard.

This slice should be production-quality before additional features are added.

## Phase 3 — Vertical Slice 2: Location and alert zones, 3 weeks

Include:

- Manual location selection;
- Optional approximate geolocation;
- Locally stored alert zones;
- Intersection evaluation;
- Rules-based ThreatScore;
- Notification preferences;
- Privacy dashboard;
- Boundary tests.

## Phase 4 — Vertical Slice 3: Offline crisis mode, 3 weeks

Include:

- Service worker;
- Offline incident packages;
- Stale-data behavior;
- Crisis text interface;
- Low-bandwidth tests;
- Read-only fallback;
- Cache migration tests.

## Phase 5 — Vertical Slice 4: Resource directory, 3 weeks

Include:

- Shelters and resources;
- Provenance;
- “Capacity unknown” behavior;
- Verification and expiration;
- Accessible search;
- Reporting incorrect information;
- Abuse controls.

## Phase 6 — Beta capabilities

Only after MVP acceptance:

- Hazard-aware routing;
- Shelter check-ins;
- Community circles;
- WebRTC prototype;
- Recovery-document workspace;
- Aid-source search;
- On-device language assistance.

## Phase 7 — Research and partnerships

Keep disabled by default until independently validated:

- Predictive hazard models;
- Medical capacity integrations;
- Pharmacy inventory;
- Insurance submissions;
- Native radio transport;
- Native background SOS;
- SMS and cell-broadcast partnerships.

---

# 20. Prioritization

## P0 — Release blockers

- Official-source provenance;
- Test/simulation labeling;
- Accessible alert pages;
- Correct freshness and expiration;
- Mobile navigation;
- No-JavaScript public alerts;
- Security controls;
- Privacy defaults;
- Provider failure handling;
- Backup and restore;
- Crisis mode;
- Removal of fabricated or unverifiable claims.

## P1 — High priority

- Offline packages;
- Local alert zones;
- Rules-based ThreatScore;
- Localization and RTL;
- Resource directory;
- Notification preferences;
- Provider health dashboard;
- Preparedness checklists.

## P2 — Beta

- Routing;
- Community reports;
- Check-ins;
- Recovery workspace;
- WebRTC communication;
- Climate visualizations.

## P3 — Research

- Hazard prediction ML;
- BLE mesh;
- Wi-Fi Direct;
- native SOS;
- hospital and pharmacy integrations;
- insurance submission;
- wearables and WebXR.

---

# 21. Release acceptance criteria

A production release should be blocked unless all applicable conditions pass.

## Safety

- Every actionable alert shows source and classification.
- Simulated alerts cannot be confused with actual alerts.
- Official instructions take precedence.
- Stale and expired data is clearly marked.
- No shelter capacity is displayed without a verified source.
- Routes never claim guaranteed safety.
- Provider failure produces last-known-good data with warnings.
- Community data cannot override official data.

## Accessibility

- Zero serious or critical Axe violations on tested routes.
- All journeys are keyboard-completable.
- Screen-reader testing is completed.
- 400% zoom is supported without loss of essential content.
- High-contrast and reduced-motion modes work.
- RTL layouts pass review.
- Map information has a non-map alternative.
- Safety-critical media has captions or transcripts.

## Performance

- Crisis text bundle remains below the documented budget.
- Cached read API p95 is below 200 ms for the target region.
- Uncached read API p95 is below 800 ms.
- Crisis text is usable on the target slow-3G profile.
- Large map packages are not loaded before user request.
- Public event pages work without JavaScript.

## Reliability

- Ingestion is idempotent.
- Retry and dead-letter behavior is tested.
- Circuit breakers and provider rate limits are configured.
- Backup restoration has been demonstrated.
- RPO and RTO are documented.
- Read-only crisis mode works during write-service failure.

## Privacy and security

- Public alert access requires no account.
- Precise location is not stored server-side by default.
- Logs contain no unnecessary location data.
- Passkeys work for optional accounts.
- Data export and deletion are verified.
- Critical dependency vulnerabilities are resolved.
- Threat-model mitigations are reviewed.
- Administrative actions are auditable.

---

# 22. Recommended first implementation slice

Do not start with the global map, AI prediction, mesh communication, or advanced personalization.

Start with one complete, trustworthy flow:

> **Ingest one documented official alert source → validate and normalize it → display an accessible alert list → provide a server-rendered event page → show provenance and freshness → cache it for offline reading → test the entire flow.**

That slice establishes the safety, data, accessibility, and operational foundations required by every later feature.

## Definition of done

- One provider classified honestly as `LIVE`, `SANDBOX`, or `MOCK`;
- Canonical schema validated;
- Idempotent ingestion;
- Duplicate and supersession handling;
- Provider-health metrics;
- Accessible list and detail pages;
- No-JavaScript support;
- Offline last-known-good alert;
- Staleness handling;
- Unit, integration, contract, end-to-end, accessibility, and security tests;
- Deployment and rollback documentation;
- No unsupported capability claims.

The central improvement is not simply making the current site visually cleaner. It is restructuring GeoAlert around **urgent decisions, trustworthy provenance, accessibility, low-bandwidth resilience, privacy, and honest technical capabilities**.