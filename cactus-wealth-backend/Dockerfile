FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
# NOTE: WeasyPrint requires system libraries like pango, cairo, and gdk-pixbuf for PDF generation
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libfontconfig1 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libgtk-3-0 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry

# Configure Poetry to create venv in project
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# Set work directory
WORKDIR /app

# 🚀 OPTIMIZATION: Copy dependency files first for maximum caching efficiency
# This layer will only be rebuilt when dependencies change, not when source code changes
COPY pyproject.toml poetry.lock* ./

# 🚀 OPTIMIZATION: Install dependencies in a separate layer for optimal caching
# This is the expensive operation that we want to cache
RUN poetry install --only main && rm -rf $POETRY_CACHE_DIR

# 🚀 OPTIMIZATION: Copy entrypoint script after dependencies for better caching
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 🚀 OPTIMIZATION: Copy source code LAST to maximize cache hits
# Source code changes frequently, but dependencies change less often
COPY . .

# Create startup script that handles full installation, migration, and server startup
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting FastAPI server with intelligent migrations..."\n\
exec poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload' > /usr/local/bin/start-server.sh && \
    chmod +x /usr/local/bin/start-server.sh

# Create ARQ worker startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting ARQ worker with intelligent setup..."\n\
exec poetry run arq src.cactus_wealth.worker.WorkerSettings' > /usr/local/bin/start-worker.sh && \
    chmod +x /usr/local/bin/start-worker.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set the intelligent entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command - will be passed as argument to entrypoint
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 