FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt

RUN python -m pip install --no-cache-dir \
    -r /app/backend/requirements.txt

COPY . /app

# ---------------------------------------------------------------------------
# PERMISSIONS FIX
# 1. Remove any staticfiles dir that arrived via COPY (root-owned).
# 2. Recreate it fresh.
# 3. Make the entire /app tree writable by any UID PrimeCloud runs as.
#    (A non-root runtime UID needs traverse permission on every parent dir.)
# ---------------------------------------------------------------------------
RUN rm -rf /app/backend/staticfiles \
    && mkdir -p /app/backend/staticfiles \
    && chmod -R 777 /app/backend/staticfiles \
    && chmod -R 777 /app

WORKDIR /app/backend

# ---------------------------------------------------------------------------
# Collect static files ONCE at build time (as root).
# WhiteNoise's CompressedManifestStaticFilesStorage REQUIRES this to have
# succeeded before the app starts. Doing it here removes the runtime
# PermissionError entirely.
# ---------------------------------------------------------------------------
RUN python manage.py collectstatic --noinput

# Re-assert permissions AFTER collectstatic creates files, so the manifest
# and hashed assets are readable/writable by the runtime UID too.
RUN chmod -R 777 /app/backend/staticfiles

EXPOSE 8000

# Runtime only runs migrate + gunicorn. No collectstatic, no permission risk.
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]