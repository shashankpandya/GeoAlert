from __future__ import annotations
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import jwt as pyjwt

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET = "geoalert-dev-secret"
CREDENTIALS_STORE: dict = {}


class RegisterRequest(BaseModel):
    username: str
    credential_id: str
    public_key: str


class LoginRequest(BaseModel):
    username: str
    credential_id: str


def make_token(username: str, role: str, hours: int = 24) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, SECRET, algorithm="HS256")


@router.post("/register/begin")
async def register_begin(username: str):
    challenge = str(uuid.uuid4())
    return {
        "challenge": challenge,
        "rp": {"name": "GeoAlert", "id": "localhost"},
        "user": {
            "id": hashlib.sha256(username.encode()).hexdigest()[:16],
            "name": username,
        },
    }


@router.post("/register/complete")
async def register_complete(req: RegisterRequest):
    CREDENTIALS_STORE[req.username] = {
        "credential_id": req.credential_id,
        "public_key": req.public_key,
        "role": "registered_user",
    }
    token = make_token(req.username, "registered_user")
    return {"token": token, "role": "registered_user"}


@router.post("/login/begin")
async def login_begin(username: str):
    challenge = str(uuid.uuid4())
    return {"challenge": challenge}


@router.post("/login/complete")
async def login_complete(req: LoginRequest):
    cred = CREDENTIALS_STORE.get(req.username)
    if not cred or cred["credential_id"] != req.credential_id:
        raise HTTPException(
            status_code=401,
            detail={"code": "UNAUTHORIZED", "message": "Invalid credentials"},
        )
    token = make_token(req.username, cred["role"])
    return {"token": token, "role": cred["role"]}
