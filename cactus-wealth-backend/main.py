"""
Main FastAPI application entry point.
"""

import time
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from contextlib import asynccontextmanager
from typing import Any

import redis.asyncio as redis
import structlog
from cactus_wealth.core.config import settings
from cactus_wealth.core.middleware import (
    add_security_headers,
    log_request,
    performance_middleware,
)
from cactus_wealth.database import create_tables
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging

# Configure structured logging
logger = structlog.get_logger()

# Redis connection for caching
redis_client: redis.Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global redis_client

    # Startup
    logger.info("Starting Cactus Wealth Backend")

    # Initialize Redis
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        await redis_client.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        redis_client = None

    # Create database tables
    # (Eliminado: create_tables(engine))

    yield

    # Shutdown
    logger.info("Shutting down Cactus Wealth Backend")
    if redis_client:
        await redis_client.close()


# Create FastAPI app with optimized settings
app = FastAPI(
    title="Cactus Wealth API",
    description="Financial advisory platform API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add middleware for performance and security
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add custom middleware
app.middleware("http")(performance_middleware)
app.middleware("http")(log_request)
app.middleware("http")(add_security_headers)

# Middleware de logging global eliminado para evitar conflictos con la validación de FastAPI


@app.on_event("startup")
def startup_event():
    create_tables()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler with structured logging."""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": time.time(),
        },
    )


@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint with performance metrics."""
    start_time = time.time()

    # Check Redis
    redis_status = "healthy"
    if redis_client:
        try:
            await redis_client.ping()
        except Exception:
            redis_status = "unhealthy"
    else:
        redis_status = "not_configured"

    # Check database
    db_status = "healthy"
    try:
        from cactus_wealth.database import get_session
        from sqlalchemy import text

        session = next(get_session())
        session.execute(text("SELECT 1"))
        session.close()
    except Exception:
        db_status = "unhealthy"

    response_time = time.time() - start_time

    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "services": {
            "database": db_status,
            "redis": redis_status,
        },
        "performance": {
            "response_time_ms": round(response_time * 1000, 2),
        },
    }


# Add root redirect
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Cactus Wealth API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Include API routes after database initialization
from cactus_wealth.api.v1.api import api_router

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
