# TrustShield 254 API (Django)

REST API for the TrustShield 254 web app. It validates requests, runs the
analysis pipeline (rules, link analysis, the team's ML models, explanation),
stores results with privacy controls, and serves the React frontend in `../frontend`.

## Setup

Requires Python 3.12. The ML packages are pinned to the versions the models in
`../AI-ML/models` were saved with; do not upgrade them independently.

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env            # then set DJANGO_SECRET_KEY
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo        # demo user, synthetic threat feed, sample history
.venv/bin/python manage.py createsuperuser  # optional, for /admin
.venv/bin/python manage.py runserver 127.0.0.1:8254
```

Then start the frontend (`cd ../frontend && nvm use && npm run dev`) and open
http://127.0.0.1:5173. Vite forwards `/api` to port 8254.

Demo account: `demo@trustshield254.ke` / `Demo@2540`.

Run the tests with `.venv/bin/python -m pytest`. `tests/test_ml.py` loads the
real models and is skipped automatically if the artifacts are missing.

## Analysis pipeline

`POST /api/scans/analyze/` with `{"scan_type": "mpesa" | "url" | "offer", "content": "...", "offer_type": "job" | "shopping" | "investment" | "other"}`

| Step | Module | Notes |
|---|---|---|
| Rule checks | `apps/scans/analysis/rules.py` | Known M-PESA and offer scam patterns, each with the exact evidence text. |
| Link analysis | `apps/scans/analysis/url_analyzer.py` | Parses the URL string only. Links are never fetched (no SSRF surface). |
| ML models | `apps/scans/analysis/ml.py` | Adapter over `AI-ML/src/model_service.py`; see below. |
| Explanation | `apps/scans/analysis/explainer.py` | Optional OpenAI-compatible LLM (`LLM_API_BASE`), template fallback. Only structured findings are sent, and replies that introduce new links or numbers are discarded. |
| Assembly | `apps/scans/analysis/engine.py` | Risk level, heuristic score, category, actions, limitations, model version. |

Risk levels: **high** (score >= 55 or two strong indicators), **caution**
(score >= 22 or one strong indicator), **clear** otherwise. The score is a
heuristic, not a calibrated probability, and the API says so.

### Community and learning features

| Feature | Where | How it works |
|---|---|---|
| M-PESA message anatomy | `rules.mpesa_anatomy` | Compares a pasted confirmation with the usual layout of genuine M-PESA messages (transaction code, `Ksh1,500.00` amount format, balance line). Missing parts become findings; a matching layout is never treated as proof. |
| Seen before (community memory) | `apps/community` | Phone numbers and non-official domains in risky checks are stored as HMAC fingerprints (`INDICATOR_HASH_KEY`), one sighting per user. A later check by someone else, or an approved community report, adds a "flagged before" finding. Raw values are never stored or returned. |
| Feedback for the ML team | `PUT /api/scans/<id>/feedback/`, `manage.py export_feedback` | Users confirm or correct a result. The export writes labelled CSV (model labels, versions, finding codes, user label) to `backend/exports/`; message text is included only for users who opted in to saving it. |
| Scam Pulse | `GET /api/pulse/` | Anonymous 7-day trends across all checks, cached for 5 minutes. Categories seen by fewer than 2 people or fewer than `PULSE_MIN_GROUP` checks are hidden. |
| Scam Sense Trainer | `apps/trainer` | 14 fictional practice messages. Each reveal runs the real pipeline (rules, link checks, ML models) so users see what TrustShield noticed. Tracks accuracy, levels and daily streaks; practice is never added to scan history. |

### How the ML models are used

The AI-ML code and artifacts are owned by the ML workstream and are imported
from `../AI-ML`, not copied. The adapter calls only the public functions
`predict_sms`, `predict_phishing_url` and `predict_job_posting`, fingerprints
each artifact (for example `sms_spam@24da4e25`) and records it in `model_version`.
If the models cannot load, every check still works with rules only and the
result says so.

| Model | Weight in the result | Reason |
|---|---|---|
| SMS spam | Moderate indicator on its own | Reliable ham/spam separation on the samples tested. |
| Phishing URL | Minor indicator, only when link checks also found something; ignored for official domains | It labels most URLs as phishing, including `safaricom.co.ke`. Its feature extractor is not yet validated against the training data. |
| Fake job | Moderate indicator, only when rule checks also found something | Trained on structured adverts; pasted text has no company metadata, so it over-flags ordinary vacancies. |

The model label is always shown to the user, with a note when it was not counted.

**Notes for the ML workstream**

- `predict_job_posting` fills missing categorical columns with `0`, which makes
  the OneHotEncoder fail. The adapter avoids this by sending every column, using
  `"Unknown"` as in training. A fix in `model_service.py` would make the function
  safe for other callers.
- Exposing a probability (`predict_proba`) from the service would let the API
  report model confidence instead of a bare label.

## Privacy

- Raw text is stored only if the user turns on **Save the text I check**
  (`preferences.save_scan_text`, off by default).
- Without consent, stored evidence is redacted: phone numbers become
  `0712 XXX 111` and long snippets are truncated. The full evidence is returned
  once in the analyze response so the UI can highlight it, but it is not saved.
- Community reports have phone numbers and emails removed before storage and
  stay private until a moderator approves them in the admin.

## API reference

All endpoints are under `/api/`. Authentication uses `Authorization: Token <key>`.
Errors follow DRF's format: `{"detail": "..."}` or `{"field": ["message"]}`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `health/` | public | Service, database and model status |
| POST | `auth/register/` | public | Create account, returns `{token, user}` |
| POST | `auth/login/` | public | `{identifier, password}`; identifier is email or phone |
| POST | `auth/logout/` | user | Revoke the token |
| GET, PATCH | `auth/me/` | user | Profile and preferences |
| POST | `scans/analyze/` | user | Run a check and save it to history |
| GET | `scans/` | user | History; filters `scan_type`, `risk_level`, `search`, `page`, `page_size` |
| GET, DELETE | `scans/<id>/` | user | One result / delete it |
| GET | `dashboard/summary/?days=7|30|90` | user | Totals, daily counts, types, top categories, recent |
| PUT | `scans/<id>/feedback/` | user | Was this result right? `{verdict, actual, comment}` |
| GET | `pulse/` | public | Anonymous community trends for the last 7 days |
| GET | `trainer/round/` | user | Five practice messages (answers withheld) and the user's stats |
| POST | `trainer/answer/` | user | `{challenge_id, answer}`; returns the lesson and the pipeline's analysis |
| GET | `trainer/stats/` | user | Level, accuracy, answered count and day streak |
| GET | `guidance/` | public | Official reporting channels (editable in admin) |
| GET, POST | `incidents/` | user | Incident summaries (consent required) |
| GET | `reports/` | public | Threat feed: synthetic and approved reports, plus your own pending ones |
| POST | `reports/` | user | Submit a report for moderation |

Rate limits: 30 checks per minute per user, 10 auth attempts per minute,
10 reports per hour.

## Deployment checklist

- `DJANGO_DEBUG=false`, a strong `DJANGO_SECRET_KEY`, real `DJANGO_ALLOWED_HOSTS`
  and `CORS_ALLOWED_ORIGINS`. HTTPS redirects, secure cookies and HSTS turn on automatically.
- Use PostgreSQL for multi-user production instead of SQLite.
- Set `INDICATOR_HASH_KEY` explicitly. Changing it later resets community memory.
- Run under gunicorn with `ML_PRELOAD=true` so models load before the first request.
- Collect static files at startup into a writable directory; production config uses
  `/tmp/trustshield-staticfiles` rather than writing under the app directory. The Docker
  startup command enforces this path even if the platform provides a different value.
- Review the contacts in **Admin > Reporting resources** against official sources.
- Frontend: build with `VITE_API_BASE_URL=https://<your-api-host>/api` and add the
  frontend's origin to `CORS_ALLOWED_ORIGINS`. `frontend/vercel.json` provides the
  SPA rewrite so deep links such as `/app/history` load on refresh.

Passwords are hashed with Argon2 (`argon2-cffi`). Accounts created with the older
PBKDF2 hasher keep working and are upgraded automatically on their next login.
