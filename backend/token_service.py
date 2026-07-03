"""
Token service: generation, hashing, and validation of one-time download tokens.

Design:
  - tokens are generated with secrets.token_urlsafe (CSPRNG)
  - only the SHA-256 hex digest is stored in the database
  - comparison uses secrets.compare_digest to resist timing attacks
  - tokens expire after TOKEN_EXPIRY_HOURS (default 24 h)
  - tokens are one-time-use: the download_used flag is checked before serving
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from config import get_settings

settings = get_settings()


def generate_token() -> str:
    """Return a URL-safe cryptographically random token (32 bytes → ~43 chars)."""
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    """Return the SHA-256 hex digest of *raw_token*."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def token_expiry() -> datetime:
    """Return a UTC datetime TOKEN_EXPIRY_HOURS from now."""
    return datetime.now(timezone.utc) + timedelta(hours=settings.TOKEN_EXPIRY_HOURS)


def verify_token(raw_token: str, stored_hash: str) -> bool:
    """
    Constant-time comparison of the incoming raw token against the stored hash.
    Returns True only when they match.
    """
    incoming_hash = hash_token(raw_token)
    # secrets.compare_digest prevents timing side-channel attacks
    return secrets.compare_digest(incoming_hash, stored_hash)


def is_token_expired(expires_at: datetime | None) -> bool:
    """Return True when the token has passed its expiry timestamp."""
    if expires_at is None:
        return True
    # Make sure we compare timezone-aware datetimes
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return now > expires_at
