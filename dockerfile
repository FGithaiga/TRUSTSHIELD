FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    STATIC_ROOT=/tmp/trustshield-staticfiles

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt

RUN python -m pip install --no-cache-dir \
    -r /app/backend/requirements.txt

COPY . /app

RUN mkdir -p /tmp/trustshield-staticfiles \
    && chmod 1777 /tmp/trustshield-staticfiles

WORKDIR /app/backend

EXPOSE 8000

# /app may be read-only at runtime, so collect static assets under /tmp.
CMD ["sh", "-c", "export STATIC_ROOT=/tmp/trustshield-staticfiles && mkdir -p \"$STATIC_ROOT\" && python manage.py migrate --noinput && python manage.py collectstatic --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]