#!/usr/bin/env bash
set -euo pipefail

echo "=== Frontend build started ==="

# Install Node dependencies
echo "Installing Node dependencies..."
npm ci

# Build for production
echo "Building frontend for production..."
npm run build

echo "=== Frontend build completed ==="
echo "Build output is in ./dist"