# Resume Access Request System – Backend

A secure FastAPI backend that gates access to Viraj Kulye's resume behind a request-and-approve workflow.

---

## 1. Architecture

```
Portfolio/
├── index.html               ← frontend (GitHub Pages)
├── css/style.css
├── js/main.js               ← fetch() calls backend API
└── backend/
    ├── main.py              ← FastAPI app, all routes
    ├── config.py            ← settings from environment variables
    ├── database.py          ← SQLAlchemy engine + session
    ├── models.py            ← ResumeAccessRequest ORM model
    ├── schemas.py           ← Pydantic request/response schemas
    ├── email_service.py     ← SMTP email sending
    ├── token_service.py     ← CSPRNG token generation + hashing
    ├── requirements.txt
    ├── .env.example         ← copy → .env and fill in values
    ├── .gitignore
    ├── private/
    │   └── VIRAJK_RESUME.pdf   ← NOT committed to git
    └── templates/
        └── admin.html       ← admin dashboard (Jinja2)
```

**Request flow:**

1. Visitor submits form on virajkulye.me → `POST /api/resume/request`
2. Backend validates, stores the request, emails the owner
3. Owner logs into `/admin` dashboard (HTTP Basic auth)
4. Owner clicks **Approve** → backend generates a one-time token, emails visitor
5. Visitor clicks the link in the email → `GET /api/resume/download/{token}`
6. Backend validates token (hash match, not expired, not used), streams the PDF
7. Token is marked used — the link stops working immediately

---

## 2. Local Backend Setup

**Requirements:** Python 3.11+ recommended.

```bash
# 1. Navigate to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate (Windows)
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy env file and fill in values
copy .env.example .env
# (then edit .env with your SMTP credentials, admin password, etc.)

# 6. Copy your resume PDF into the private directory
copy ..\files\VIRAJK_RESUME.pdf private\VIRAJK_RESUME.pdf

# 7. Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API is now running at `http://localhost:8000`.  
Health check: `http://localhost:8000/health`  
Interactive docs: `http://localhost:8000/docs`

---

## 3. Environment Variables

Copy `.env.example` → `.env` and fill in every value.

| Variable | Description |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `DATABASE_URL` | SQLAlchemy connection string (default: SQLite) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587 for TLS) |
| `SMTP_USERNAME` | Your SMTP login / sender email |
| `SMTP_PASSWORD` | SMTP password or App Password — **never commit this** |
| `OWNER_EMAIL` | Your inbox where new-request notifications go |
| `FROM_EMAIL` | From address on outgoing emails |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password **(recommended)** |
| `ADMIN_PASSWORD` | Plain-text admin password (local dev only, ignored if hash is set) |
| `FRONTEND_URL` | Public URL of your portfolio site |
| `BACKEND_PUBLIC_URL` | Public URL of the deployed backend (used in email links) |
| `TOKEN_EXPIRY_HOURS` | How long a download token is valid (default: 24) |
| `REQUEST_COOLDOWN_MINUTES` | Duplicate-request block period (default: 60) |
| `RESUME_PATH` | Absolute path to the resume PDF (default: `private/VIRAJK_RESUME.pdf`) |
| `DOCS_ENABLED` | Set to `false` to disable `/docs` in production |

---

## 4. SMTP Setup (Gmail example)

1. Enable 2-Step Verification on your Google account
2. Generate an **App Password**: Google Account → Security → App Passwords
3. Set in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=you@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx   ← 16-char app password
   OWNER_EMAIL=you@gmail.com
   FROM_EMAIL=you@gmail.com
   ```

For other providers (Outlook, SendGrid, Mailgun) change `SMTP_HOST` and `SMTP_PORT` accordingly.

---

## 5. Database Initialization

Tables are created automatically on first startup via:

```python
Base.metadata.create_all(bind=engine)
```

No migration scripts are needed for initial setup. The SQLite file `resume_requests.db` is created in the `backend/` directory and is excluded from git.

**For PostgreSQL in production**, change `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## 6. Starting FastAPI

```bash
# Development (auto-reload on file changes)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production (multiple workers)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## 7. Connecting Frontend to Backend

In `js/main.js`, the backend URL is configured in one place:

```js
const API_BASE_URL =
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://YOUR_PRODUCTION_BACKEND_URL'; // ← replace this
```

Replace `YOUR_PRODUCTION_BACKEND_URL` with your deployed backend URL (e.g. `https://api.virajkulye.me`) before deploying the frontend.

---

## 8. Admin Login

The admin dashboard is protected with **HTTP Basic Authentication**, enforced server-side on every request. There is no frontend-only bypass.

**Access the dashboard:**

```
http://localhost:8000/admin
```

Your browser will show a login prompt. Enter the `ADMIN_USERNAME` and password you set in `.env`.

**Generate a bcrypt password hash** (recommended for production):

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"
```

Paste the output into `ADMIN_PASSWORD_HASH` in your `.env`.

**Admin API endpoints** (also require Basic auth):

```
GET  /api/admin/requests
POST /api/admin/requests/{id}/approve
POST /api/admin/requests/{id}/reject
```

---

## 9. Approval Workflow

1. A visitor submits the form on the portfolio site
2. A notification email is sent to `OWNER_EMAIL` with all request details
3. Open the admin dashboard at `/admin`
4. Find the pending request and click **Approve**
5. The backend:
   - Generates a `secrets.token_urlsafe(32)` token
   - Stores only its SHA-256 hash in the database
   - Sets expiry to `now + TOKEN_EXPIRY_HOURS`
   - Changes status to `approved`
   - Sends the visitor an email with the download link
6. The visitor clicks the link — the PDF streams directly from the private server directory
7. The token is marked `download_used = True` immediately after the first successful download

To **reject** a request, click **Reject** in the dashboard. A polite email is sent to the visitor.

---

## 10. Token Security

| Property | Implementation |
|---|---|
| Generation | `secrets.token_urlsafe(32)` — 256 bits of entropy from OS CSPRNG |
| Storage | SHA-256 hex digest only — raw token is never saved to DB |
| Comparison | `secrets.compare_digest` on hashed values — constant-time, resists timing attacks |
| Expiry | Configurable via `TOKEN_EXPIRY_HOURS` (default 24 hours) |
| Policy | **One-time use** — `download_used` flag set before streaming; reuse returns HTTP 410 |
| Path traversal | The resume path is configured server-side only — no user input touches the file path |

---

## 11. Resume Storage Security

**Local development:** Place `VIRAJK_RESUME.pdf` in `backend/private/`. The `private/` directory is excluded from git via `.gitignore`.

**Important:** The file in `files/VIRAJK_RESUME.pdf` on the frontend repo should be **removed or replaced with a placeholder** before pushing to GitHub Pages. Otherwise it remains publicly accessible.

**Production deployment options:**

| Option | How |
|---|---|
| **Platform secret/private file** | Render, Railway, Fly.io all support private file mounts or secret files that are not in the git repository. Upload the PDF through the platform dashboard and set `RESUME_PATH` to the mount path. |
| **Object storage (recommended for scale)** | Upload to AWS S3 (private bucket) or Cloudflare R2. Generate a pre-signed URL at approval time and link to that instead of the backend download endpoint. |
| **Environment variable (small files only)** | Base64-encode the PDF and store it as an env var. Decode and write to a temp file at startup. Not ideal for large PDFs. |

For a personal portfolio, the simplest production approach is a **private file mount** on your hosting platform (e.g., Render's Secret Files or Railway's volume).

---

## 12. Production Deployment Considerations

- [ ] Set `DOCS_ENABLED=false` to hide `/docs`
- [ ] Set `ALLOWED_ORIGINS` to only `https://virajkulye.me` (no localhost)
- [ ] Set `BACKEND_PUBLIC_URL` to your deployed backend URL
- [ ] Use `ADMIN_PASSWORD_HASH` (bcrypt) instead of plain `ADMIN_PASSWORD`
- [ ] Use PostgreSQL instead of SQLite for persistent storage
- [ ] Remove `files/VIRAJK_RESUME.pdf` from the frontend GitHub repository
- [ ] Set up a private file mount or object storage for the resume PDF
- [ ] Enable HTTPS on the backend (your hosting platform handles this)
- [ ] Consider rate limiting (see below)

**Rate limiting:** FastAPI does not include built-in rate limiting. For production, add `slowapi`:

```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/resume/request")
@limiter.limit("5/hour")
def submit_resume_request(request: Request, ...):
    ...
```

---

## 13. CORS Configuration

CORS is configured in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

`ALLOWED_ORIGINS` is read from `.env`. For production set:

```
ALLOWED_ORIGINS=https://virajkulye.me,https://www.virajkulye.me
```

Never use `allow_origins=["*"]` in production — it bypasses the same-origin protection for credentialed requests.

---

## 14. End-to-End Test Walkthrough

### Prerequisites

- Backend running at `http://localhost:8000`
- `.env` filled in (SMTP optional for first tests — the request will still be stored)
- Portfolio served locally (e.g. VS Code Live Server at `http://127.0.0.1:5500`)

### Steps

**1. Submit a valid request**
- Open `http://127.0.0.1:5500` in the browser
- Scroll to the Resume section
- Click **Request Resume Access**
- Fill in all fields and click **Submit Access Request**
- Expected: success message shown; check `resume_requests.db` for the new row

**2. Test duplicate cooldown**
- Submit again with the same email within the cooldown window
- Expected: HTTP 429 response, friendly error message shown in the form

**3. Test invalid input**
- Submit with an empty name or invalid email
- Expected: client-side validation messages appear; no network request is made

**4. View request in admin**
- Open `http://localhost:8000/admin` (enter credentials)
- Expected: request appears in the Pending tab

**5. Test unauthorized access**
- `curl http://localhost:8000/api/admin/requests` with no credentials
- Expected: HTTP 401

**6. Approve the request**
- Click **Approve** in the admin dashboard
- Expected: status changes to Approved; approval email sent to the visitor's address

**7. Download with valid token**
- Click the download link in the approval email
- Expected: PDF downloads immediately; link then returns HTTP 410 on second click

**8. Test invalid token**
- `curl http://localhost:8000/api/resume/download/badtoken`
- Expected: HTTP 404

**9. Test expired token**
- Set `TOKEN_EXPIRY_HOURS=0` in `.env`, approve a request, try the link
- Expected: HTTP 404 (expired)

**10. Reject a request**
- Click **Reject** in the dashboard
- Expected: rejection email sent; status changes to Rejected

**11. Verify dark mode**
- Toggle dark mode on the portfolio; resume section should match the theme

**12. Verify mobile layout**
- Open DevTools → responsive mode at 375px wide
- The form should be full-width, buttons stacked vertically
