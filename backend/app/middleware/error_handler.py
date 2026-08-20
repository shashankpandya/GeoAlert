import uuid
from datetime import datetime, timezone
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_FAILED",
                "message": "Request validation failed",
                "details": exc.errors(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "requestId": str(uuid.uuid4()),
            }
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": str(exc.status_code),
                "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "requestId": str(uuid.uuid4()),
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "requestId": str(uuid.uuid4()),
            }
        },
    )
