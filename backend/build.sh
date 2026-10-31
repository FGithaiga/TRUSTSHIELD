#!/usr/bin/env bash
set -euo pipefail

echo "=== Backend build started ==="

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Ensure a writable static directory exists before Django collects static files
export STATIC_ROOT="${STATIC_ROOT:-/tmp/trustshield-staticfiles}"
mkdir -p "$STATIC_ROOT"
chmod 1777 "$STATIC_ROOT"

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Seed demo data (idempotent)
echo "Seeding demo data..."
python manage.py seed_demo --noinput 2>/dev/null || true

echo "=== Backend build completed ==="