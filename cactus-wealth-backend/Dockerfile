# ================================
# 🚀 ULTRA-OPTIMIZED MULTI-STAGE BUILD
# ================================

# ---- Etapa Builder ----
FROM python:3.12-slim as builder

WORKDIR /app

# Install Poetry with export plugin
RUN pip install --no-cache-dir poetry poetry-plugin-export

# Copy only dependency files for optimal Docker caching
COPY pyproject.toml poetry.lock ./

# Create a requirements.txt and install with pip for smaller image
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --only=main && \
    pip install --no-cache-dir --user -r requirements.txt

# ---- Etapa Final ----
FROM python:3.12-slim

WORKDIR /app

# Install ONLY essential runtime libraries for WeasyPrint
RUN apt-get update && apt-get install -y \
    curl \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy the installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH="/root/.local/bin:$PATH"

# Copy ONLY the application source code
COPY ./src ./src
COPY ./main.py ./main.py
COPY ./entrypoint.sh ./entrypoint.sh
COPY ./alembic.ini ./alembic.ini
COPY ./alembic ./alembic

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Create optimized worker startup script
RUN echo '#!/bin/bash\nset -e\necho "🔥 Starting ARQ worker..."\nexec python -m arq src.cactus_wealth.worker.WorkerSettings' > /usr/local/bin/start-worker.sh && \
    chmod +x /usr/local/bin/start-worker.sh

# Expose port
EXPOSE 8000

# Optimized health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Set entrypoint and command
ENTRYPOINT ["./entrypoint.sh"]
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 