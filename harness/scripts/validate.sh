#!/bin/bash
set -e

echo "=== Starting CeLiLac Validation Pipeline ==="

echo "[1/4] Installing dependencies in all workspaces..."
if [ ! -d "backend/node_modules" ]; then
  (cd backend && npm ci --prefer-offline --no-audit --no-fund)
else
  echo "Backend dependencies already installed. Skipping."
fi

if [ ! -d "frontend/web-app/node_modules" ]; then
  (cd frontend/web-app && npm ci --prefer-offline --no-audit --no-fund)
else
  echo "Frontend web-app dependencies already installed. Skipping."
fi

if [ ! -d "frontend/landing-page/node_modules" ]; then
  (cd frontend/landing-page && npm ci --prefer-offline --no-audit --no-fund)
else
  echo "Landing page dependencies already installed. Skipping."
fi

if command -v flutter &> /dev/null; then
  echo "Instalando dependências do Flutter..."
  (cd frontend/mobile-app && flutter pub get)
else
  echo "[Warning] Flutter não está instalado. Pulando instalação de dependências mobile."
fi

echo "[2/4] Testing Backend..."
(cd backend && npm test -- --passWithNoTests)

echo "[3/4] Building Frontend Apps..."
(cd frontend/web-app && npm run build)
(cd frontend/landing-page && npm run build)

echo "[4/4] Analyzing and Testing Mobile App..."
if command -v flutter &> /dev/null; then
  (cd frontend/mobile-app && flutter analyze && flutter test)
else
  echo "[Warning] Flutter não está instalado. Pulando análise e testes mobile."
fi

echo "=== Validation Successful! ==="
