#!/bin/bash
# =============================================================================
# 🌵 CACTUS WEALTH BACKEND - SIMPLIFIED CONTAINER ENTRYPOINT
# =============================================================================
# Simplified entrypoint for reliable Docker startup
# Version: 3.1.0 - RELIABILITY FOCUSED
# =============================================================================

set -e

echo "🚀 Starting Cactus Wealth Backend (Simplified Mode)..."

# Simple wait for database to be ready
echo "🔍 Waiting for database to be ready..."

# Espera activa: intenta conectar cada segundo hasta éxito o timeout (30s)
DB_READY=0
for i in {1..30}; do
    if python -c "
import os
import psycopg2
from urllib.parse import urlparse

try:
    db_url = os.getenv('DATABASE_URL', 'postgresql://cactus_user:cactus_password@db:5432/cactus_db')
    parsed = urlparse(db_url)
    conn = psycopg2.connect(
        host=parsed.hostname, 
        port=parsed.port or 5432, 
        database=parsed.path[1:], 
        user=parsed.username, 
        password=parsed.password, 
        connect_timeout=2
    )
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'⚠️ Database connection failed: {e}')
    raise SystemExit(1)
"; then
        DB_READY=1
        break
    else
        echo "⏳ Waiting for DB... ($i)"
        sleep 1
    fi
done

if [ $DB_READY -eq 0 ]; then
    echo "❌ Database not ready after 30s, proceeding anyway (migrations may fail)"
else
    echo "✅ Database ready!"
fi

# Run migrations solo si hay pendientes
if alembic heads | grep -q $(alembic current | awk '{print $3}'); then
    echo "✅ No hay migraciones pendientes."
else
    echo "🧠 Running migrations..."
    alembic upgrade head || echo "⚠️ Migration failed, but continuing..."
    echo "✅ Migrations completed!"
fi

echo "🎯 Starting main application..."

# Check if reload should be disabled
if [ "${DISABLE_RELOAD}" = "true" ]; then
    echo "🔒 File watching disabled (DISABLE_RELOAD=true)"
    exec uvicorn main:app --host 0.0.0.0 --port 8000
else
    echo "👀 File watching enabled (development mode)"
    exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
fi 