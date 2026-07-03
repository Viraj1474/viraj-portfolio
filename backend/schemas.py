"""
Pydantic schemas for request validation and response serialization.

All user-supplied string fields are:
  - stripped of leading/trailing whitespace
  - bounded by reasonable length limits
  - validated with regex or email validator where appropriate
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# ── Helpers ───────────────────────────────────────────────────────────────────

_SAFE_TEXT_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")  # control chars


def _sanitize(value: str) -> str:
    """Strip whitespace and remove dangerous control characters."""
    return _SAFE_TEXT_RE.sub("", value.strip())


# ── Inbound ───────────────────────────────────────────────────────────────────


class ResumeRequestCreate(BaseModel):
    """Schema for POST /api/resume/request payload."""

    full_name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    company: str = Field(..., min_length=1, max_length=120)
    job_role: str = Field(..., min_length=1, max_length=120)
    reason: str = Field(..., min_length=10, max_length=1000)

    @field_validator("full_name", "company", "job_role", "reason", mode="before")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Must be a string")
        return _sanitize(v)


# ── Outbound ──────────────────────────────────────────────────────────────────


class ResumeRequestOut(BaseModel):
    """Public-safe representation of a resume access request (no token data)."""

    id: int
    full_name: str
    email: str
    company: str
    job_role: str
    reason: str
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    download_used: bool
    downloaded_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ── Admin auth ────────────────────────────────────────────────────────────────


class AdminLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=80)
    password: str = Field(..., min_length=1, max_length=200)


# ── Generic responses ─────────────────────────────────────────────────────────


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
