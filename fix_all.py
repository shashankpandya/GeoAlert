import pathlib, shutil, os, re

ROOT   = pathlib.Path(r"c:\Users\admin\.vscode\Code\react-app\Geo\geoalert-v2")
FE     = ROOT / "frontend"
BE     = ROOT / "backend"
OLD    = pathlib.Path(r"c:\Users\admin\.vscode\Code\react-app\Geo")

# =========================================================
# 1.  Copy the old Earth Pulse files into frontend/public/classic/
# =========================================================
classic = FE / "public" / "classic"
classic.mkdir(parents=True, exist_ok=True)

# Copy index.html -> classic/index.html  (rename from EarthPulse.html or index.html)
old_html = OLD / "EarthPulse.html"
if not old_html.exists():
    old_html = OLD / "index.html"

if old_html.exists():
    shutil.copy2(old_html, classic / "index.html")
    print("Copied old index.html to classic/")
else:
    print("WARNING: old index.html not found")

# Copy app.js, app.css, Weather.html, Weather.css, Weather.js, modules/
for name in ["app.js", "app.css", "Weather.html", "Weather.css", "Weather.js"]:
    src = OLD / name
    if src.exists():
        shutil.copy2(src, classic / name)
        print(f"Copied {name}")

modules_src = OLD / "modules"
if modules_src.exists():
    modules_dst = classic / "modules"
    if modules_dst.exists():
        shutil.rmtree(modules_dst)
    shutil.copytree(modules_src, modules_dst)
    print("Copied modules/")

# Fix paths in classic/index.html to be relative
html_path = classic / "index.html"
if html_path.exists():
    content = html_path.read_text(encoding="utf-8", errors="replace")
    # Make sure script src and link hrefs work from /classic/ 
    # app.js and app.css are already in /classic/ so no path fix needed
    html_path.write_text(content, encoding="utf-8")
    print("classic/index.html ready")

# =========================================================
# 2.  Fix layout.tsx  - remove LayoutProps<"/"> type error
# =========================================================
layout = FE / "src" / "app" / "layout.tsx"
content = layout.read_text(encoding="utf-8")
# Fix the broken LayoutProps type
content = content.replace(
    "}: LayoutProps<\"/\">) {",
    "}: { children: React.ReactNode }) {"
)
content = content.replace(
    "export default function RootLayout({ children }: LayoutProps<\"/\">)",
    "export default function RootLayout({ children }: { children: React.ReactNode })"
)
# Add React import if missing
if "import React" not in content and "from 'react'" not in content:
    content = "import React from 'react';\n" + content
layout.write_text(content, encoding="utf-8")
print("layout.tsx fixed")

# =========================================================
# 3.  Rewrite src/app/page.tsx - proper GeoAlert homepage
# =========================================================
home = FE / "src" / "app" / "page.tsx"
home_content = '''import Link from "next/link";

export default function Home() {
  return (
    <main
      role="main"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #010409 0%, #0d1117 50%, #010409 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#e6edf3",
        padding: "24px 16px",
      }}
    >
      {/* Globe animation */}
      <div
        aria-hidden="true"
        style={{
          fontSize: "6rem",
          lineHeight: 1,
          marginBottom: "24px",
          animation: "pulse 3s ease-in-out infinite",
          filter: "drop-shadow(0 0 24px rgba(0,212,255,0.4))",
        }}
      >
        🌍
      </div>

      <h1
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 900,
          background: "linear-gradient(135deg, #00d4ff, #bc8cff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          marginBottom: "12px",
          letterSpacing: "-0.02em",
        }}
      >
        GeoAlert v2
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          color: "#8b949e",
          textAlign: "center",
          maxWidth: "540px",
          lineHeight: 1.6,
          marginBottom: "40px",
        }}
      >
        Safety-first crisis response platform — real-time emergency alerts,
        offline resilience, and official source verification.
      </p>

      {/* Primary CTAs */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center",
          marginBottom: "56px",
        }}
      >
        <Link
          href="/crisis"
          style={{
            padding: "14px 28px",
            background: "#dc2626",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
            transition: "opacity .15s",
          }}
          aria-label="Open Crisis Mode — text-only emergency view"
        >
          ⚠ Crisis Mode
        </Link>

        <Link
          href="/map"
          style={{
            padding: "14px 28px",
            background: "#1d4ed8",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
          }}
          aria-label="Open interactive alert map"
        >
          🗺 Live Map
        </Link>

        <Link
          href="/privacy"
          style={{
            padding: "14px 28px",
            background: "#161b22",
            color: "#8b949e",
            border: "1px solid #30363d",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
          }}
        >
          🔒 Privacy
        </Link>
      </div>

      {/* Feature grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          maxWidth: "720px",
          width: "100%",
          marginBottom: "48px",
        }}
      >
        {[
          { icon: "📡", title: "Official Sources", desc: "Verified government feeds with provenance badges" },
          { icon: "📴", title: "Works Offline", desc: "Service Worker + IndexedDB — alerts when connectivity fails" },
          { icon: "♿", title: "WCAG 2.2 AA", desc: "Keyboard nav, screen readers, 400% zoom support" },
          { icon: "🔒", title: "Privacy-first", desc: "No precise GPS stored — coarse location only" },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              background: "#161b22",
              border: "1px solid #21262d",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "1.6rem", marginBottom: "8px" }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "4px" }}>{f.title}</div>
            <div style={{ fontSize: "0.8rem", color: "#8b949e", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Classic version link */}
      <div
        style={{
          borderTop: "1px solid #21262d",
          paddingTop: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "0.85rem", color: "#6e7681", marginBottom: "10px" }}>
          Looking for the original Earth Pulse platform?
        </p>
        <a
          href="/classic/"
          style={{
            color: "#58a6ff",
            fontSize: "0.9rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            border: "1px solid #30363d",
            borderRadius: "6px",
            transition: "border-color .15s",
          }}
          aria-label="View the classic Earth Pulse version of GeoAlert"
        >
          🌐 View Classic Version (Earth Pulse v4)
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </main>
  );
}
'''
home.write_text(home_content, encoding="utf-8")
print("Homepage (page.tsx) rewritten")

# =========================================================
# 4.  Fix backend config.py — add Neon DATABASE_URL support
# =========================================================
config = BE / "app" / "config.py"
config_content = '''from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Neon PostgreSQL connection string (set in .env or environment)
    # Format: postgresql+asyncpg://user:password@ep-xxx.neon.tech/dbname?sslmode=require
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/geoalert"
    REDIS_URL: str = "redis://localhost:6379/0"
    API_KEY: str = "changeme-in-production"
    SECRET_KEY: str = "changeme-in-production-secret"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://geoalert.vercel.app"]
    # Neon requires SSL — automatically added when DATABASE_URL contains neon.tech
    NEON_MODE: bool = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-detect Neon and enable SSL mode
        if "neon.tech" in self.DATABASE_URL and "sslmode" not in self.DATABASE_URL:
            object.__setattr__(self, "DATABASE_URL", self.DATABASE_URL + "?ssl=require")
        if "neon.tech" in self.DATABASE_URL:
            object.__setattr__(self, "NEON_MODE", True)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
'''
config.write_text(config_content, encoding="utf-8")
print("backend config.py updated with Neon support")

# =========================================================
# 5.  Fix backend database.py — Neon SSL + engine args
# =========================================================
database = BE / "app" / "database.py"
db_content = '''from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


def _make_engine():
    connect_args = {}
    # Neon PostgreSQL requires SSL
    if settings.NEON_MODE or "neon.tech" in settings.DATABASE_URL:
        connect_args["ssl"] = "require"
    return create_async_engine(
        settings.DATABASE_URL,
        echo=settings.ENVIRONMENT == "development",
        pool_pre_ping=True,
        connect_args=connect_args,
        pool_size=5,
        max_overflow=10,
    )


engine = _make_engine()
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
'''
database.write_text(db_content, encoding="utf-8")
print("database.py updated for Neon SSL")

# =========================================================
# 6.  Create backend/.env.example for Neon
# =========================================================
env_example = BE / ".env.example"
env_example.write_text(
    "# Neon PostgreSQL\n"
    "DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?ssl=require\n\n"
    "# Redis (Upstash or local)\n"
    "REDIS_URL=redis://localhost:6379/0\n\n"
    "# Security\n"
    "API_KEY=your-secret-api-key-here\n"
    "SECRET_KEY=your-secret-jwt-key-here\n\n"
    "# Environment\n"
    "ENVIRONMENT=development\n"
    "CORS_ORIGINS=[\"http://localhost:3000\"]\n",
    encoding="utf-8",
)
print(".env.example created")

# =========================================================
# 7.  Add JWT to requirements.txt if missing
# =========================================================
req_path = BE / "requirements.txt"
req_text = req_path.read_text(encoding="utf-8")
if "PyJWT" not in req_text:
    req_path.write_text(req_text.strip() + "\nPyJWT==2.12.0\n", encoding="utf-8")
    print("PyJWT added to requirements.txt")
else:
    print("PyJWT already in requirements.txt")

print("\nAll fixes applied successfully!")