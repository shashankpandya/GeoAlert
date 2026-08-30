# GeoAlert v2

Safety-first crisis response platform with real-time emergency alerts,
offline resilience, official source verification, and WCAG 2.2 AA accessibility.

## Structure

```
geoalert-v2/
|-- frontend/          Next.js 16 App Router (TypeScript + Tailwind CSS)
|   |-- src/
|   |   |-- app/           Pages: / /crisis /map /privacy /admin
|   |   |-- components/    MapView, AlertDetailsPanel, AppNav, ThemeProvider...
|   |   |-- lib/           offline-db.ts, location.ts
|   |   `-- types/         Shared TypeScript types + calculateFreshness()
|   `-- public/
|       `-- classic/       Earth Pulse v1 static files (served at /classic/)
|-- backend/           FastAPI + PostgreSQL/PostGIS + Redis + Celery
|   |-- app/
|   |   |-- routers/       17 API endpoints
|   |   |-- services/      SourceClassifier, AlertIngestionService
|   |   |-- parsers/       CAP 1.2 XML, GeoJSON, custom format
|   |   |-- models/        SQLAlchemy ORM (sources, alerts, areas, logs)
|   |   |-- schemas/       Pydantic v2 request/response schemas
|   |   |-- middleware/    Rate limiting (Upstash TLS), error handlers
|   |   `-- tasks/         Celery async ingestion
|   |-- alembic/           Database migrations
|   |-- tests/             10 pytest tests (no DB required)
|   |-- requirements.txt
|   `-- .env.example       Copy to .env and fill in credentials
`-- .github/workflows/     CI/CD pipelines
```

## Quick start

```bash
# 1. Backend
cd backend
cp .env.example .env        # paste Neon DATABASE_URL and Upstash REDIS_URL
pip install -r requirements.txt
alembic upgrade head         # creates tables on Neon
uvicorn app.main:app --reload

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon: `postgresql+asyncpg://...?ssl=require` |
| `DATABASE_URL_POOLED` | Yes | Neon pooled endpoint (for Alembic) |
| `REDIS_URL` | Optional | Upstash: `rediss://...` (rate limiting) |
| `API_KEY` | Yes | Secret key for `/api/alerts/ingest` |
| `SECRET_KEY` | Yes | JWT signing key |
| `CORS_ORIGINS` | Yes | JSON array e.g. `["http://localhost:3000"]` |

## Pages

| URL | Description |
|-----|-------------|
| `/` | Homepage with live alert preview and feature grid |
| `/map` | Interactive MapLibre map with sidebar alert list |
| `/crisis` | Text-only emergency view, under 100KB, works on 2G |
| `/privacy` | Location consent, data export and deletion |
| `/admin` | Provider health dashboard, auto-refreshes every 30s |
| `/classic/` | Earth Pulse v1 static app (no server needed) |
| `:8000/api/docs` | FastAPI Swagger UI — all 17 endpoints |
```
