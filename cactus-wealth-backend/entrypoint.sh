#!/bin/bash
# =============================================================================
# 🌵 CACTUS WEALTH BACKEND - INTELLIGENT CONTAINER ENTRYPOINT
# =============================================================================
# Smart entrypoint with conditional migrations for maximum performance
# Author: Principal Platform Architect  
# Version: 2.0.0 - PERFORMANCE OPTIMIZED WITH INTELLIGENCE
# =============================================================================

# Detiene la ejecución del script si algún comando falla
set -e

echo "🚀 Starting Cactus Wealth Backend Container (Intelligent Mode)..."
echo "📍 Working directory: $(pwd)"
echo "🐍 Python version: $(python --version)"

# Install dependencies first
echo "📦 Installing all dependencies and current project..."
poetry install --only main

# Activa el entorno virtual creado por Poetry
# Asumiendo que poetry.toml está configurado para crear el venv dentro del proyecto
if [ -d "/app/.venv" ]; then
    echo "🔧 Activating Python virtual environment..."
    source /app/.venv/bin/activate
    echo "✅ Python virtual environment activated."
    echo "🐍 Active Python: $(which python)"
    echo "📦 Active pip: $(which pip)"
    
    # Verificar que alembic esté disponible
    if command -v alembic &> /dev/null; then
        echo "✅ Alembic command verified and available."
    else
        echo "❌ ERROR: Alembic not found in virtual environment!"
        echo "📋 Available commands in venv:"
        ls -la /app/.venv/bin/ | grep -E "(alembic|python|pip)" || true
        exit 1
    fi
else
    echo "⚠️ Virtual environment not found at /app/.venv"
    echo "📋 Directory contents:"
    ls -la /app/ || true
    echo "🔧 Attempting to use Poetry run instead..."
fi

# Espera a que la base de datos esté lista (health check básico)
echo "🔍 Waiting for database to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if python -c "
import os
import psycopg2
from urllib.parse import urlparse

# Get database URL from environment
db_url = os.getenv('DATABASE_URL', 'postgresql://cactus_user:cactus_password@db:5432/cactus_db')
parsed = urlparse(db_url)

try:
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path[1:],  # Remove leading slash
        user=parsed.username,
        password=parsed.password
    )
    conn.close()
    print('Database connection successful')
    exit(0)
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" 2>/dev/null; then
        echo "✅ Database is ready!"
        break
    else
        echo "⏳ Database not ready yet (attempt $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "⚠️ Database connection timeout - proceeding anyway..."
fi

# 🧠 INTELLIGENT MIGRATION SYSTEM - Only run when necessary
echo "🧠 Checking database migration status (intelligent mode)..."

# Get the latest migration revision from the migration files
if [ -d "/app/.venv" ]; then
    LATEST_MIGRATION=$(alembic heads 2>/dev/null | awk '{print $1}' | head -n1)
    CURRENT_DB_REVISION=$(alembic current 2>/dev/null | awk '{print $1}' | head -n1)
else
    LATEST_MIGRATION=$(poetry run alembic heads 2>/dev/null | awk '{print $1}' | head -n1)
    CURRENT_DB_REVISION=$(poetry run alembic current 2>/dev/null | awk '{print $1}' | head -n1)
fi

echo "📊 Migration Analysis:"
echo "  - Latest available migration: ${LATEST_MIGRATION:-<none>}"
echo "  - Current database revision: ${CURRENT_DB_REVISION:-<none>}"

# Check if migrations are needed
if [ -n "$LATEST_MIGRATION" ] && [ -n "$CURRENT_DB_REVISION" ] && [ "$LATEST_MIGRATION" = "$CURRENT_DB_REVISION" ]; then
    echo "✅ Database is already up to date. Skipping migrations."
    echo "⚡ Startup optimization: Saved ~3-5 seconds by skipping unnecessary migrations!"
else
    echo "🔥 Database migration required. Applying migrations..."
    if [ -d "/app/.venv" ]; then
        alembic upgrade head
    else
        poetry run alembic upgrade head
    fi
    echo "✅ Database migrations completed successfully."
    
    # Verify the migration was successful
    if [ -d "/app/.venv" ]; then
        NEW_DB_REVISION=$(alembic current 2>/dev/null | awk '{print $1}' | head -n1)
    else
        NEW_DB_REVISION=$(poetry run alembic current 2>/dev/null | awk '{print $1}' | head -n1)
    fi
    
    if [ "$NEW_DB_REVISION" = "$LATEST_MIGRATION" ]; then
        echo "✅ Migration verification successful: Database now at revision $NEW_DB_REVISION"
    else
        echo "⚠️ Migration verification failed: Expected $LATEST_MIGRATION, got $NEW_DB_REVISION"
    fi
fi

# Imprime información del entorno para debugging
echo "🔍 Environment Information:"
echo "  - Working Directory: $(pwd)"
echo "  - Python Path: $(which python)"
echo "  - Virtual Env: ${VIRTUAL_ENV:-Not set}"
echo "  - Poetry Config: $(poetry config --list | grep virtualenvs.in-project || echo 'N/A')"

echo "🎯 Ready to start the main application with intelligent optimizations..."

# Ejecuta el comando principal del contenedor que se pasa como argumento (ej. uvicorn)
exec "$@" 