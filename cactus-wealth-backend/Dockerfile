# ================================
# 🚀 ULTRA-OPTIMIZED MULTI-STAGE BUILD
# ================================

# ---- Etapa Builder ----
FROM python:3.12-slim as builder

WORKDIR /app

# Instalar solo dependencias primero para cache óptimo
COPY pyproject.toml poetry.lock ./
RUN pip install --no-cache-dir poetry poetry-plugin-export
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --only=main && \
    echo "typing_extensions>=4.12.2" >> requirements.txt

# ---- Etapa Final ----
FROM python:3.12-slim

WORKDIR /app

# Instalar solo librerías esenciales para runtime
RUN apt-get update && apt-get install -y \
    curl \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copiar requirements y solo después instalar
COPY --from=builder /app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir typing_extensions>=4.12.2 anyio>=4.6.2 cffi certifi platformdirs yfinance

# Copiar solo el código fuente necesario
COPY ./src ./src
COPY ./main.py ./main.py
COPY ./entrypoint.sh ./entrypoint.sh
COPY ./entrypoint_worker.sh ./entrypoint_worker.sh
COPY ./alembic.ini ./alembic.ini
COPY ./alembic ./alembic

RUN chmod +x ./entrypoint.sh ./entrypoint_worker.sh

ENV PYTHONPATH="/app/src:$PYTHONPATH"

HEALTHCHECK --interval=15s --timeout=5s --start-period=3s --retries=2 \
    CMD curl -f http://localhost:8000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 