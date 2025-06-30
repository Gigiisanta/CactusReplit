#!/bin/bash
# =============================================================================
# 🌵 CACTUS WEALTH BACKEND - OPTIMIZED CONTAINER ENTRYPOINT
# =============================================================================
# Ultra-fast entrypoint for optimized Docker images
# Version: 3.0.0 - MAXIMUM OPTIMIZATION
# =============================================================================

set -e

echo "🚀 Starting Cactus Wealth Backend (Ultra-Optimized Mode)..."

# Wait for database to be ready (minimal health check)
echo "🔍 Waiting for database..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if python -c "
import os, psycopg2
from urllib.parse import urlparse
db_url = os.getenv('DATABASE_URL', 'postgresql://cactus_user:cactus_password@db:5432/cactus_db')
parsed = urlparse(db_url)
try:
    conn = psycopg2.connect(host=parsed.hostname, port=parsed.port or 5432, database=parsed.path[1:], user=parsed.username, password=parsed.password)
    conn.close()
    exit(0)
except:
    exit(1)
" 2>/dev/null; then
        echo "✅ Database ready!"
        break
    else
        echo "⏳ Database not ready yet ($attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    fi
done

# Run migrations only if needed
echo "🧠 Checking migrations..."
LATEST_MIGRATION=$(alembic heads 2>/dev/null | awk '{print $1}' | head -n1)
CURRENT_DB_REVISION=$(alembic current 2>/dev/null | awk '{print $1}' | head -n1)

if [ "$LATEST_MIGRATION" != "$CURRENT_DB_REVISION" ]; then
    echo "🔥 Running migrations..."
    alembic upgrade head
    echo "✅ Migrations completed!"
else
    echo "✅ Database up to date!"
fi

echo "🎯 Starting main application..."
exec "$@" 