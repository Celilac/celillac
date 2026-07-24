#!/bin/bash
set -e

echo "=== Starting CeLiLac Validation Pipeline ==="

echo "[1/4] Installing dependencies in all workspaces..."
(cd backend && npm install)
(cd frontend/web-app && npm install)
(cd frontend/landing-page && npm install)

if command -v flutter &> /dev/null; then
  echo "Instalando dependências do Flutter..."
  (cd frontend/mobile-app && flutter pub get)
else
  echo "[Warning] Flutter não está instalado. Pulando instalação de dependências mobile."
fi

echo "[2/4] Testing Backend..."
(cd backend && npm test)

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
