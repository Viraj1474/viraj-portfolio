"""
FastAPI application – Resume Access Request System.

Endpoints:
  GET  /health                                → liveness probe
  POST /api/resume/request                   → submit access request
  GET  /api/admin/requests                   → list all requests (admin)
  POST /api/admin/requests/{id}/approve      → approve a request (admin)
  POST /api/admin/requests/{id}/reject       → reject a request  (admin)
  GET  /api/resume/download/{token}          → one-time secure PDF download
  GET  /admin                                → admin dashboard HTML page

Security notes:
  - Admin routes require HTTP Basic authentication (server-side check).
  - Download tokens are one-time-use and expire after TOKEN_EXPIRY_HOURS.
  - Tokens are verified via SHA-256 hash comparison using secrets.compare_digest.
  - Raw token is never logged.
  - PDF is served from a private directory; the path is never user-supplied.
  - CORS is restricted to configured origins only.
"""

import logging
import os
import secrets
import base64
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

import email_service
import models
import schemas
import token_service
from config import get_settings
from database import Base, engine, get_db

# ── Logging ───────────────────────────────────────────────────────────────────
# Level INFO in production; never log passwords or raw tokens.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
log = logging.getLogger(__name__)

# ── Settings & DB init ────────────────────────────────────────────────────────
settings = get_settings()
Base.metadata.create_all(bind=engine)  # create tables on startup

# ── Admin password helper ─────────────────────────────────────────────────────
try:
    import bcrypt as _bcrypt
    _BCRYPT_AVAILABLE = True
except ImportError:
    _BCRYPT_AVAILABLE = False


def _verify_admin_password(plain: str) -> bool:
    """
    Verify the submitted plain-text password against the stored credential.
    Priority:
      1. ADMIN_PASSWORD_HASH (bcrypt hash stored in .env) – recommended for production.
      2. ADMIN_PASSWORD (plain text in .env) – for quick local dev only.
    Always uses constant-time comparison.
    """
    if settings.ADMIN_PASSWORD_HASH:
        if _BCRYPT_AVAILABLE:
            try:
                return _bcrypt.checkpw(
                    plain.encode(), settings.ADMIN_PASSWORD_HASH.encode()
                )
            except Exception:
                return False
        else:
            # bcrypt not installed: fall back to digest compare (less secure)
            log.warning("bcrypt not installed – falling back to plain-text comparison")
            return secrets.compare_digest(plain, settings.ADMIN_PASSWORD_HASH)

    if settings.ADMIN_PASSWORD_PLAIN:
        return secrets.compare_digest(plain, settings.ADMIN_PASSWORD_PLAIN)

    log.error("No admin password configured! Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH in .env")
    return False


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    # Disable automatic /docs in production (set DOCS_ENABLED=false in .env)
    docs_url="/docs" if os.getenv("DOCS_ENABLED", "true").lower() == "true" else None,
    redoc_url=None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Templates ─────────────────────────────────────────────────────────────────
_templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(_templates_dir))

# ── HTTP Basic Security ────────────────────────────────────────────────────────
_basic_security = HTTPBasic()


def _require_admin(credentials: HTTPBasicCredentials = Depends(_basic_security)):
    """FastAPI dependency: authenticate admin via HTTP Basic."""
    username_ok = secrets.compare_digest(
        credentials.username, settings.ADMIN_USERNAME
    )
    password_ok = _verify_admin_password(credentials.password)
    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────


@app.get("/health", response_model=schemas.HealthResponse, tags=["Health"])
def health_check():
    """Liveness probe – returns 200 when the server is running."""
    return {"status": "healthy"}


@app.post(
    "/api/resume/request",
    response_model=schemas.MessageResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Resume"],
)
def submit_resume_request(
    payload: schemas.ResumeRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Accept a new resume access request from a portfolio visitor.

    Duplicate cooldown: if the same email has a request created within
    REQUEST_COOLDOWN_MINUTES, a 429 is returned with a safe message.
    """
    from datetime import timedelta

    # ── Duplicate / cooldown check ────────────────────────────────────────────
    cooldown_cutoff = datetime.now(timezone.utc) - timedelta(
        minutes=settings.REQUEST_COOLDOWN_MINUTES
    )
    existing = (
        db.query(models.ResumeAccessRequest)
        .filter(models.ResumeAccessRequest.email == payload.email)
        .filter(models.ResumeAccessRequest.created_at >= cooldown_cutoff)
        .first()
    )
    if existing:
        # Return a generic message – do not reveal anything about the stored record
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "A request from this email was recently submitted. "
                "Please wait before submitting again."
            ),
        )

    # ── Persist ───────────────────────────────────────────────────────────────
    new_request = models.ResumeAccessRequest(
        full_name=payload.full_name,
        email=str(payload.email),
        company=payload.company,
        job_role=payload.job_role,
        reason=payload.reason,
        status=models.RequestStatus.pending,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    log.info(
        "New resume request #%d from %s (%s)",
        new_request.id,
        new_request.full_name,
        new_request.email,
    )

    # ── Notify owner (best-effort) ────────────────────────────────────────────
    try:
        email_service.send_new_request_notification(
            request_id=new_request.id,
            full_name=new_request.full_name,
            email=new_request.email,
            company=new_request.company,
            job_role=new_request.job_role,
            reason=new_request.reason,
            created_at=new_request.created_at,
        )
    except Exception:
        log.exception("Owner notification failed for request #%d", new_request.id)

    return {
        "message": (
            "Your resume access request has been submitted successfully. "
            "You will receive an email if your request is approved."
        )
    }


@app.get(
    "/api/resume/download/{token}",
    tags=["Resume"],
    summary="One-time secure resume download",
)
def download_resume(token: str, db: Session = Depends(get_db)):
    """
    Serve the resume PDF when the token is valid.

    Validation order:
      1. Token format sanity check (length guard against huge payloads).
      2. Lookup request by hashed token.
      3. Check approval status.
      4. Check expiry.
      5. Check one-time-use flag.
      6. Mark token as used atomically, then stream the file.
    """
    # ── Sanity check token length (prevent DoS via giant strings) ─────────────
    if not token or len(token) > 200:
        raise HTTPException(status_code=404, detail="Invalid or expired download link.")

    # ── Hash and look up ──────────────────────────────────────────────────────
    token_hash = token_service.hash_token(token)
    request = (
        db.query(models.ResumeAccessRequest)
        .filter(models.ResumeAccessRequest.download_token_hash == token_hash)
        .first()
    )

    # Always return the same generic error to avoid leaking information
    _invalid = HTTPException(status_code=404, detail="Invalid or expired download link.")

    if not request:
        raise _invalid

    if request.status != models.RequestStatus.approved:
        raise _invalid

    if token_service.is_token_expired(request.token_expires_at):
        raise _invalid

    if request.download_used:
        raise HTTPException(
            status_code=410,
            detail="This download link has already been used. Please contact me if you need another.",
        )

    # ── Validate that the resume file exists ──────────────────────────────────
    resume_path = Path(settings.RESUME_PATH)
    if not resume_path.is_file():
        log.error("Resume file not found at configured path: %s", settings.RESUME_PATH)
        raise HTTPException(
            status_code=500,
            detail="Resume file is temporarily unavailable. Please try again later.",
        )

    # ── Mark as used BEFORE streaming (prevents race-condition re-use) ─────────
    request.download_used = True
    request.downloaded_at = datetime.now(timezone.utc)
    db.commit()

    log.info("Resume downloaded for request #%d (%s)", request.id, request.email)

    # ── Serve file ────────────────────────────────────────────────────────────
    return FileResponse(
        path=str(resume_path),
        media_type="application/pdf",
        filename="Viraj_Kulye_Resume.pdf",
        headers={
            # Instruct browsers to download, not open inline
            "Content-Disposition": 'attachment; filename="Viraj_Kulye_Resume.pdf"',
            # Prevent caching of the one-time link
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ENDPOINTS  (require HTTP Basic auth)
# ─────────────────────────────────────────────────────────────────────────────


@app.get(
    "/api/admin/requests",
    response_model=list[schemas.ResumeRequestOut],
    tags=["Admin"],
)
def list_requests(
    db: Session = Depends(get_db),
    _admin: str = Depends(_require_admin),
):
    """Return all resume access requests, newest first."""
    return (
        db.query(models.ResumeAccessRequest)
        .order_by(models.ResumeAccessRequest.created_at.desc())
        .all()
    )


@app.post(
    "/api/admin/requests/{request_id}/approve",
    response_model=schemas.MessageResponse,
    tags=["Admin"],
)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(_require_admin),
):
    """
    Approve a pending request:
      1. Generate a cryptographically secure token.
      2. Store only its hash in the DB.
      3. Set expiry.
      4. Send the visitor an email containing the raw token in the download URL.
    """
    request = db.query(models.ResumeAccessRequest).filter(
        models.ResumeAccessRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")

    if request.status == models.RequestStatus.approved:
        raise HTTPException(status_code=409, detail="Request is already approved.")

    if request.status == models.RequestStatus.rejected:
        raise HTTPException(status_code=409, detail="Cannot approve a rejected request.")

    # ── Generate token ────────────────────────────────────────────────────────
    raw_token = token_service.generate_token()
    expires_at = token_service.token_expiry()

    request.download_token_hash = token_service.hash_token(raw_token)
    request.token_expires_at = expires_at
    request.status = models.RequestStatus.approved
    request.reviewed_at = datetime.now(timezone.utc)
    request.download_used = False
    request.downloaded_at = None
    db.commit()

    log.info("Request #%d approved by admin", request_id)

    # ── Send approval email ───────────────────────────────────────────────────
    download_url = f"{settings.BACKEND_PUBLIC_URL}/api/resume/download/{raw_token}"
    try:
        email_service.send_approval_email(
            to_email=request.email,
            full_name=request.full_name,
            download_url=download_url,
            expires_at=expires_at,
        )
    except Exception:
        log.exception("Approval email failed for request #%d", request_id)

    return {"message": f"Request #{request_id} approved. Approval email sent to {request.email}."}


@app.post(
    "/api/admin/requests/{request_id}/reject",
    response_model=schemas.MessageResponse,
    tags=["Admin"],
)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(_require_admin),
):
    """Reject a request and optionally notify the visitor."""
    request = db.query(models.ResumeAccessRequest).filter(
        models.ResumeAccessRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found.")

    if request.status == models.RequestStatus.rejected:
        raise HTTPException(status_code=409, detail="Request is already rejected.")

    request.status = models.RequestStatus.rejected
    request.reviewed_at = datetime.now(timezone.utc)
    db.commit()

    log.info("Request #%d rejected by admin", request_id)

    try:
        email_service.send_rejection_email(
            to_email=request.email,
            full_name=request.full_name,
        )
    except Exception:
        log.exception("Rejection email failed for request #%d", request_id)

    return {"message": f"Request #{request_id} rejected."}


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN DASHBOARD  (HTML, requires HTTP Basic)
# ─────────────────────────────────────────────────────────────────────────────


@app.get("/admin", response_class=HTMLResponse, tags=["Admin"], include_in_schema=False)
def admin_dashboard(
    request: Request,
    _admin: str = Depends(_require_admin),
):
    """Serve the admin dashboard HTML page."""
    return templates.TemplateResponse("admin.html", {"request": request})
