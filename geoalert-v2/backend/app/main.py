from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import alerts as alerts_router
from app.routers import sources as sources_router
from app.routers import auth as auth_router
from app.routers import admin as admin_router
from app.routers import notifications as notif_router
from app.routers import users as users_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.error_handler import (
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)

app = FastAPI(
    title="GeoAlert API",
    version="2.0.0",
    description=(
        "Safety-first crisis alert platform API. Provides real-time emergency alerts "
        "with spatial filtering, provenance classification, and offline support."
    ),
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting ---
app.add_middleware(RateLimitMiddleware)

# --- Security headers ---
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# --- Exception handlers ---
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# --- Routers ---
app.include_router(alerts_router.router)
app.include_router(sources_router.router)
app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(notif_router.router)
app.include_router(users_router.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}
