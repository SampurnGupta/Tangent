"""JWT creation, decoding, and FastAPI security dependencies."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from fastapi import Header, HTTPException, status

from gateway.config import GatewaySettings


def create_access_token(
    user_id: str,
    settings: GatewaySettings,
    is_guest: bool = True,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed HS256 JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=settings.jwt_exp_hours)

    payload: dict[str, Any] = {
        "sub": user_id,
        "is_guest": is_guest,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, settings: GatewaySettings) -> dict[str, Any]:
    """Verify and decode a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    """Extract raw JWT token string from Authorization header."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def get_current_user_id(
    authorization: Optional[str] = Header(None),
    settings: Optional[GatewaySettings] = None,
) -> str:
    """FastAPI dependency to extract and validate authenticated user/guest ID."""
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cfg = settings or GatewaySettings()
    payload = decode_access_token(token, cfg)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(user_id)


def generate_guest_id() -> str:
    """Generate a clean RFC-4122 UUID4 string for guest users."""
    return str(uuid.uuid4())
