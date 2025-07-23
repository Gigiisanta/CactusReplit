#!/bin/bash

# CACTUS MASTER - CactusDashboard (Replit Native Deploy Edition)
# Subcomandos: setup, test, build, deploy, report, db:migrate
# Requiere: DB_URL, JWT_SECRET, N8N_WEBHOOK como secrets

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CACHE_DIR="/home/runner/.cache-cactus"
if ! mkdir -p "$CACHE_DIR" 2>/dev/null; then
  CACHE_DIR="$PROJECT_ROOT/.cactus-cache"
  mkdir -p "$CACHE_DIR"
fi
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/cactus.log"
DEPLOY_LOG="$PROJECT_ROOT/deploy-log.txt"
SEED_LOCK="$LOG_DIR/.seed.lock"

BACKEND_DIR="$PROJECT_ROOT/cactus-wealth-backend"
FRONTEND_DIR="$PROJECT_ROOT/cactus-wealth-frontend"

REQUIRED_SECRETS=(DB_URL JWT_SECRET N8N_WEBHOOK)

abort_if_missing_secrets() {
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if [[ -z "${!secret:-}" ]]; then
      echo "[ERROR] Missing required secret: $secret" >&2
      exit 1
    fi
  done
}

if [ -f "$PROJECT_ROOT/.env" ]; then
  set -o allexport
  source "$PROJECT_ROOT/.env"
  set +o allexport
fi

mkdir -p "$CACHE_DIR" "$LOG_DIR"

main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
    setup)
      echo "[SETUP] Detectando stack y preparando entorno..."
      if [[ -f "$BACKEND_DIR/pyproject.toml" ]]; then
        cd "$BACKEND_DIR"
        if ! command -v poetry >/dev/null 2>&1; then
          pip install --user poetry
          export PATH="$HOME/.local/bin:$PATH"
        fi
        poetry install --no-root
      elif [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
        cd "$BACKEND_DIR"
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
      fi
      cd "$FRONTEND_DIR"
      if [[ -f "package-lock.json" ]]; then
        npm ci --cache "$CACHE_DIR/npm" --prefer-offline
      else
        npm install --cache "$CACHE_DIR/npm" --prefer-offline
      fi
      echo "[SETUP] Completado."
      ;;
    test)
      echo "[TEST] Ejecutando tests en paralelo..."
      export DB_URL="sqlite:///$(mktemp -u)/test.db"
      cd "$BACKEND_DIR"
      if [[ -f "pyproject.toml" ]]; then
        poetry run pytest -n auto
      else
        source venv/bin/activate
        pytest -n auto
      fi
      cd "$FRONTEND_DIR"
      npm test -- --maxWorkers=$(nproc)
      echo "[TEST] Completado."
      ;;
    build)
      echo "[BUILD] Compilando frontend y backend..."
      cd "$FRONTEND_DIR"
      npm run build
      cd "$BACKEND_DIR"
      if [[ -f "pyproject.toml" ]]; then
        poetry build || true
      fi
      echo "[BUILD] Completado."
      ;;
    db:migrate)
      echo "[DB] Ejecutando migraciones..."
      abort_if_missing_secrets
      cd "$BACKEND_DIR"
      if [[ -f "pyproject.toml" ]]; then
        poetry run alembic upgrade head
      else
        source venv/bin/activate
        alembic upgrade head
      fi
      echo "[DB] Migraciones completadas."
      ;;
    deploy)
      abort_if_missing_secrets
      start_time=$(date +%s)
      echo "[DEPLOY] Iniciando deploy nativo en Replit..."
      "$0" test
      "$0" build
      "$0" db:migrate
      # Lanzar SOLO el backend como proceso principal para Replit
      cd "$BACKEND_DIR"
      # Si quieres servir el frontend estático desde FastAPI, asegúrate de copiar el build al directorio público del backend y descomenta la línea correspondiente en FastAPI.
      exec uvicorn src.cactus_wealth.main:app --host 0.0.0.0 --port 8000
      # ---
      # Si prefieres exponer el frontend, comenta la línea de arriba y descomenta:
      # cd "$FRONTEND_DIR"
      # exec npm run start
      # ---
      # El logging y webhook pueden moverse a un post-deploy si se requiere:
      # CU_USED=42
      # GIT_SHA=$(git rev-parse --short HEAD)
      # STATUS=success
      # ENDPOINT_URL="https://$REPL_SLUG.$REPL_OWNER.repl.co"
      # end_time=$(date +%s)
      # duration=$((end_time - start_time))
      # echo "$(date -Iseconds) | CU: $CU_USED | Duration: ${duration}s | Status: $STATUS | SHA: $GIT_SHA | URL: $ENDPOINT_URL" >> "$DEPLOY_LOG"
      # curl -X POST -H "Content-Type: application/json" -d '{"status":"'$STATUS'","sha":"'$GIT_SHA'","cu":'$CU_USED',"url":"'$ENDPOINT_URL'"}' "$N8N_WEBHOOK" || true
      # echo "[DEPLOY] Completado. URL: $ENDPOINT_URL"
      ;;
    report)
      echo "[REPORT] Últimos 10 deploys:"
      tail -n 10 "$DEPLOY_LOG"
      ;;
    *)
      echo "CactusDashboard CLI (Replit Native)"
      echo "Uso: ./cactus.sh <setup|test|build|deploy|report|db:migrate>"
      ;;
  esac
}

main "$@"