"""
Email service: send notification and approval/rejection emails via SMTP.

Security:
  - credentials are read from settings (environment variables only)
  - SMTP password is never logged or included in error messages returned to clients
  - all email failures are logged to stderr and do NOT surface to public API callers
"""

import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import get_settings

settings = get_settings()
log = logging.getLogger(__name__)


# ── Internal helper ───────────────────────────────────────────────────────────


def _send(to_address: str, subject: str, html_body: str) -> bool:
    """
    Send a single HTML email.
    Returns True on success, False on failure.
    Raises nothing – callers should not surface email errors to end users.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        log.warning("SMTP credentials not configured – email not sent to %s", to_address)
        return False

    from_address = settings.FROM_EMAIL or settings.SMTP_USERNAME

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Viraj Kulye Portfolio <{from_address}>"
    msg["To"] = to_address

    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(from_address, [to_address], msg.as_string())
        log.info("Email sent successfully to %s | subject: %s", to_address, subject)
        return True
    except smtplib.SMTPAuthenticationError:
        log.error("SMTP authentication failed – check SMTP_USERNAME / SMTP_PASSWORD")
    except smtplib.SMTPException as exc:
        log.error("SMTP error sending to %s: %s", to_address, type(exc).__name__)
    except OSError as exc:
        log.error("Network error sending email to %s: %s", to_address, type(exc).__name__)
    return False


# ── Owner notification ────────────────────────────────────────────────────────


def send_new_request_notification(
    request_id: int,
    full_name: str,
    email: str,
    company: str,
    job_role: str,
    reason: str,
    created_at: datetime,
) -> bool:
    """Notify the portfolio owner that a new resume access request has arrived."""
    if not settings.OWNER_EMAIL:
        log.warning("OWNER_EMAIL not configured – owner notification skipped")
        return False

    admin_url = f"{settings.BACKEND_PUBLIC_URL}/admin"
    subject = f"[Portfolio] New Resume Request #{request_id} – {full_name}"
    html = f"""
    <div style="font-family: 'Roboto', Arial, sans-serif; max-width:600px; margin:auto;
                border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
      <div style="background:#d4af37; padding:20px 30px;">
        <h2 style="color:#fff; margin:0; font-family:'Playfair Display',serif;">
          New Resume Access Request
        </h2>
      </div>
      <div style="padding:30px; background:#fff;">
        <p style="margin-top:0;">A new resume access request has been submitted:</p>
        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
          <tr><td style="padding:8px 0; color:#888; width:40%;">Request ID</td>
              <td style="padding:8px 0;"><strong>#{request_id}</strong></td></tr>
          <tr><td style="padding:8px 0; color:#888;">Name</td>
              <td style="padding:8px 0;">{full_name}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Email</td>
              <td style="padding:8px 0;">{email}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Company</td>
              <td style="padding:8px 0;">{company}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Job Role / Purpose</td>
              <td style="padding:8px 0;">{job_role}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Request Date</td>
              <td style="padding:8px 0;">{created_at.strftime('%Y-%m-%d %H:%M UTC')}</td></tr>
        </table>
        <div style="margin-top:16px; padding:16px; background:#f9f9f9; border-left:4px solid #d4af37;
                    border-radius:0 4px 4px 0;">
          <strong>Reason:</strong><br>
          <p style="margin:8px 0 0; white-space:pre-wrap;">{reason}</p>
        </div>
        <p style="margin-top:24px;">
          <a href="{admin_url}" style="display:inline-block; background:#d4af37; color:#fff;
             padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600;">
            Review in Admin Dashboard
          </a>
        </p>
      </div>
      <div style="background:#f5f5f5; padding:15px 30px; font-size:0.8rem; color:#888;">
        This is an automated notification from your portfolio backend.
      </div>
    </div>
    """
    return _send(settings.OWNER_EMAIL, subject, html)


# ── Approval email ────────────────────────────────────────────────────────────


def send_approval_email(
    to_email: str,
    full_name: str,
    download_url: str,
    expires_at: datetime,
) -> bool:
    """Send the visitor a professional approval email with their secure download link."""
    subject = "Your Resume Access Request Has Been Approved – Viraj Kulye"
    expiry_str = expires_at.strftime("%Y-%m-%d %H:%M UTC")
    html = f"""
    <div style="font-family: 'Roboto', Arial, sans-serif; max-width:600px; margin:auto;
                border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
      <div style="background:#d4af37; padding:20px 30px;">
        <h2 style="color:#fff; margin:0; font-family:'Playfair Display',serif;">
          Resume Access Approved
        </h2>
      </div>
      <div style="padding:30px; background:#fff;">
        <p>Hi <strong>{full_name}</strong>,</p>
        <p>Thank you for your interest! I've reviewed your request and am happy to share my resume with you.</p>
        <p>Please use the secure link below to download it:</p>
        <p style="margin:24px 0; text-align:center;">
          <a href="{download_url}"
             style="display:inline-block; background:#d4af37; color:#fff;
                    padding:14px 32px; border-radius:6px; text-decoration:none;
                    font-weight:600; font-size:1rem;">
            &#x1F4C4; Download Resume
          </a>
        </p>
        <div style="background:#fff8e1; border:1px solid #ffe082; border-radius:6px; padding:16px; font-size:0.9rem;">
          <strong>&#x26A0;&#xFE0F; Important:</strong>
          <ul style="margin:8px 0 0 0; padding-left:20px;">
            <li>This link expires on <strong>{expiry_str}</strong></li>
            <li>The link is <strong>single-use only</strong> – it will stop working after the first download</li>
            <li>Do not share this link</li>
          </ul>
        </div>
        <p style="margin-top:24px;">Looking forward to connecting with you!</p>
        <p style="margin-bottom:0;">
          Best regards,<br>
          <strong>Viraj Kulye</strong><br>
          <a href="https://virajkulye.me" style="color:#d4af37;">virajkulye.me</a>
        </p>
      </div>
      <div style="background:#f5f5f5; padding:15px 30px; font-size:0.8rem; color:#888;">
        If you did not request access, you can safely ignore this email.
      </div>
    </div>
    """
    return _send(to_email, subject, html)


# ── Rejection email ───────────────────────────────────────────────────────────


def send_rejection_email(to_email: str, full_name: str) -> bool:
    """Send a polite rejection email."""
    subject = "Re: Resume Access Request – Viraj Kulye"
    html = f"""
    <div style="font-family: 'Roboto', Arial, sans-serif; max-width:600px; margin:auto;
                border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
      <div style="background:#555; padding:20px 30px;">
        <h2 style="color:#fff; margin:0; font-family:'Playfair Display',serif;">
          Resume Access Request Update
        </h2>
      </div>
      <div style="padding:30px; background:#fff;">
        <p>Hi <strong>{full_name}</strong>,</p>
        <p>Thank you for your interest in my profile. After reviewing your request, I'm unable to share my resume at this time.</p>
        <p>I appreciate your understanding, and I wish you the best in your search.</p>
        <p style="margin-bottom:0;">
          Best regards,<br>
          <strong>Viraj Kulye</strong><br>
          <a href="https://virajkulye.me" style="color:#d4af37;">virajkulye.me</a>
        </p>
      </div>
      <div style="background:#f5f5f5; padding:15px 30px; font-size:0.8rem; color:#888;">
        This is an automated message from the portfolio contact system.
      </div>
    </div>
    """
    return _send(to_email, subject, html)
