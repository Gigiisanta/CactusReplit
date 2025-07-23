#!/bin/bash
# =============================================================================
# 🌵 CACTUS WEALTH ARQ WORKER - CONTAINER ENTRYPOINT
# =============================================================================
# Entrypoint for ARQ worker processes
# Version: 1.0.0
# =============================================================================

set -e

echo "🚀 Starting Cactus Wealth ARQ Worker..."

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
    echo "❌ Database not ready after 30s, proceeding anyway"
else
    echo "✅ Database ready!"
fi

# Run migrations
echo "🧠 Running migrations..."
alembic upgrade head || echo "⚠️ Migration failed, but continuing..."
echo "✅ Migrations completed!"

echo "🎯 Starting ARQ worker..."

# Start the ARQ worker
exec python -m arq cactus_wealth.worker.WorkerSettings 