"""
Configuration module.
All settings are read from environment variables (loaded from .env by python-dotenv).
No sensitive value is ever hardcoded here.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── Application ──────────────────────────────────────────────────────────
    APP_TITLE: str = "Resume Access Request API"
    APP_VERSION: str = "1.0.0"

    # ── CORS – allowed origins ───────────────────────────────────────────────
    # Comma-separated list in .env, e.g.:
    #   ALLOWED_ORIGINS=https://virajkulye.me,https://www.virajkulye.me
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500",
        ).split(",")
        if origin.strip()
    ]

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resume_requests.db")

    # ── SMTP ─────────────────────────────────────────────────────────────────
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    # ── Email addresses ──────────────────────────────────────────────────────
    OWNER_EMAIL: str = os.getenv("OWNER_EMAIL", "")          # your inbox for notifications
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "")            # sender address (often same as SMTP_USERNAME)

    # ── Admin credentials ────────────────────────────────────────────────────
    # Store the BCRYPT hash of your chosen password in .env, not the plain text.
    # Generate with:  python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD_HASH: str = os.getenv("ADMIN_PASSWORD_HASH", "")

    # Fallback plain password for first-run convenience (NOT for production).
    # If ADMIN_PASSWORD_HASH is set, this field is ignored.
    ADMIN_PASSWORD_PLAIN: str = os.getenv("ADMIN_PASSWORD", "")

    # ── URLs ─────────────────────────────────────────────────────────────────
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://virajkulye.me")
    BACKEND_PUBLIC_URL: str = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")

    # ── Token settings ────────────────────────────────────────────────────────
    # How many hours a download token remains valid
    TOKEN_EXPIRY_HOURS: int = int(os.getenv("TOKEN_EXPIRY_HOURS", "24"))

    # Duplicate-request cooldown in minutes
    REQUEST_COOLDOWN_MINUTES: int = int(os.getenv("REQUEST_COOLDOWN_MINUTES", "60"))

    # ── File paths ────────────────────────────────────────────────────────────
    # Absolute path to the private resume PDF; resolved relative to this file's directory
    _backend_dir: str = os.path.dirname(os.path.abspath(__file__))
    RESUME_PATH: str = os.getenv(
        "RESUME_PATH",
        os.path.join(_backend_dir, "private", "VIRAJK_RESUME.pdf"),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a singleton Settings instance."""
    return Settings()
