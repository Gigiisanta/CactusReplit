# ================================
# 🚀 MULTI-STAGE BUILD OPTIMIZATION
# ================================

# Stage 1: Builder - Full environment for building dependencies
FROM python:3.12-slim AS builder

# Set environment variables for build stage
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies and system libraries needed for WeasyPrint
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

# Configure Poetry
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

# Copy dependency files first for optimal caching
COPY pyproject.toml poetry.lock* ./

# Install ALL dependencies (including dev) for building
RUN poetry install && rm -rf $POETRY_CACHE_DIR

# Copy source code
COPY . .

# ================================
# Stage 2: Runtime - Minimal production image
# ================================

FROM python:3.12-slim AS runtime

# Runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Install ONLY runtime system dependencies (minimal set)
RUN apt-get update && apt-get install -y \
    curl \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libfontconfig1 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy ONLY the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy ONLY the application source code (no build tools, no cache)
COPY --from=builder /app/src ./src
COPY --from=builder /app/main.py ./
COPY --from=builder /app/entrypoint.sh ./
COPY --from=builder /app/pyproject.toml ./

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Create optimized startup scripts
RUN echo '#!/bin/bash\nset -e\necho "Starting FastAPI server..."\nexec python -m uvicorn main:app --host 0.0.0.0 --port 8000' > /usr/local/bin/start-server.sh && \
    chmod +x /usr/local/bin/start-server.sh

RUN echo '#!/bin/bash\nset -e\necho "Starting ARQ worker..."\nexec python -m arq src.cactus_wealth.worker.WorkerSettings' > /usr/local/bin/start-worker.sh && \
    chmod +x /usr/local/bin/start-worker.sh

# Expose port
EXPOSE 8000

# Optimized health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set entrypoint
ENTRYPOINT ["./entrypoint.sh"]

# Default command
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 