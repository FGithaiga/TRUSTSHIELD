#!/usr/bin/env bash
set -euo pipefail

echo "=== Backend build started ==="

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Seed demo data (idempotent)
echo "Seeding demo data..."
python manage.py seed_demo --noinput 2>/dev/null || true

echo "=== Backend build completed ==="