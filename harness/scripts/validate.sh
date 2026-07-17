#!/bin/bash
set -e

echo "=== Starting CeLiLac Validation Pipeline ==="

echo "[1/4] Installing dependencies in all workspaces..."
(cd backend && npm install)
(cd frontend/web-app && npm install)
(cd frontend/landing-page && npm install)
(cd frontend/mobile-app && flutter pub get)

echo "[2/4] Testing Backend..."
(cd backend && npm test)

echo "[3/4] Building Frontend Apps..."
(cd frontend/web-app && npm run build)
(cd frontend/landing-page && npm run build)

echo "[4/4] Analyzing and Testing Mobile App..."
(cd frontend/mobile-app && flutter analyze && flutter test)

echo "=== Validation Successful! ==="
