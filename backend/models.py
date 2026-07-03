"""
SQLAlchemy ORM models.

Security notes:
- Raw download tokens are NEVER stored here.
- download_token_hash stores a SHA-256 hex digest of the token.
- Comparing tokens must use secrets.compare_digest on the hashed values.
"""

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class RequestStatus(str, PyEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ResumeAccessRequest(Base):
    __tablename__ = "resume_access_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # ── Visitor-supplied fields ───────────────────────────────────────────────
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(120), nullable=False)
    job_role: Mapped[str] = mapped_column(String(120), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    # ── Lifecycle ─────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        Enum(RequestStatus),
        default=RequestStatus.pending,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Download token (hashed) ───────────────────────────────────────────────
    # The raw token is emailed to the visitor and never stored.
    # Only a SHA-256 hex digest is kept so a DB breach cannot expose working links.
    download_token_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Download tracking ─────────────────────────────────────────────────────
    download_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    downloaded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<ResumeAccessRequest id={self.id} email={self.email!r} status={self.status}>"
        )
