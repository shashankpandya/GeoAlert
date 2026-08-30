# GeoAlert

Emergency alert platform with two versions in this repository.

---

## Version 1 — Earth Pulse (Classic)

Original static platform. No build step, no server required.

| File | Description |
|------|-------------|
| `index.html` | Main entry — Earth Pulse v4 interactive globe |
| `EarthPulse.html` | Alternative entry point |
| `app.js` / `app.css` | Core application code |
| `modules/` | Feature modules: climate, geography, spaceweather, weather |
| `Weather.html` | Standalone weather widget |
| `DEPLOYMENT.md` | Vercel deployment notes |
| `GLOBE_GUIDE.md` | Globe feature guide |
| `AUDIT.md` | Code audit notes |
| `CHANGELOG_GLOBE.md` | Globe changelog |
| `IMPROVEMENTS.md` | Improvement plan notes |

**Run locally:** Open `index.html` in any browser — zero install.

**Live:** https://geoalert-natural-events-hub.vercel.app/classic/

---

## Version 2 — GeoAlert v2 (Full-stack)

Safety-first crisis response platform. Production-ready.

```
geoalert-v2/
  frontend/    Next.js 16 App Router, TypeScript, MapLibre GL, Tailwind CSS
  backend/     FastAPI, PostgreSQL/PostGIS (Neon), Redis (Upstash), Celery
  .github/     CI/CD workflows
```

See [geoalert-v2/README.md](geoalert-v2/README.md) for full setup instructions.

Quick start:
```bash
# Backend
cd geoalert-v2/backend
cp .env.example .env      # fill in your Neon + Upstash credentials
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd geoalert-v2/frontend
npm install
npm run dev               # http://localhost:3000
```

---

## Repository structure

```
GeoAlert/
|
|-- index.html              Earth Pulse v1 (classic — open in browser)
|-- EarthPulse.html
|-- app.js / app.css
|-- modules/               Classic feature modules
|-- Weather.html/css/js    Standalone weather widget
|-- vercel.json            Vercel config for classic deployment
|-- DEPLOYMENT.md
|-- AUDIT.md
|-- CHANGELOG_GLOBE.md
|-- GLOBE_GUIDE.md
|-- IMPROVEMENTS.md
|
|-- geoalert-v2/           GeoAlert v2 full-stack platform
|   |-- frontend/          Next.js 16 frontend
|   |-- backend/           FastAPI backend
|   `-- .github/workflows/ CI/CD pipelines
|
|-- .kiro/specs/           Feature specs (requirements, design, tasks)
|-- .vscode/               Editor configuration
`-- README.md              This file
```

---

## Author

[Shashank Pandya](https://github.com/shashankpandya)
