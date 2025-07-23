"""
Performance and security middleware for FastAPI.
"""

import time
from typing import Callable, Awaitable

import redis.asyncio as redis
import structlog
from cactus_wealth.core.config import settings
from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = structlog.get_logger()


async def performance_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Middleware to monitor request performance."""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate performance metrics
    process_time = time.time() - start_time

    # Log performance data
    logger.info(
        "Request processed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        process_time_ms=round(process_time * 1000, 2),
        user_agent=request.headers.get("user-agent", ""),
    )

    # Add performance headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Response-Time"] = str(process_time)

    return response


async def log_request(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Middleware to log request details."""
    # Log incoming request
    logger.info(
        "Incoming request",
        method=request.method,
        path=request.url.path,
        query_params=dict(request.query_params),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", ""),
    )

    response = await call_next(request)

    # Log response
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        content_length=response.headers.get("content-length", 0),
    )

    return response


async def add_security_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Middleware to add security headers."""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    # Cache control for API responses
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "public, max-age=300, s-maxage=300"
    else:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

    return response


async def caching_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Middleware for Redis caching."""
    # Skip caching for non-GET requests
    if request.method != "GET":
        return await call_next(request)

    # Skip caching for certain paths
    skip_paths = ["/health", "/docs", "/openapi.json"]
    if any(path in request.url.path for path in skip_paths):
        return await call_next(request)

    # Try to get from cache
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        cache_key = f"cache:{request.method}:{request.url.path}:{request.url.query}"

        cached_response = await redis_client.get(cache_key)
        if cached_response:
            logger.info("Cache hit", path=request.url.path)
            return JSONResponse(
                content=cached_response,
                headers={"X-Cache": "HIT"},
            )

        await redis_client.close()
    except Exception as e:
        logger.warning(f"Cache error: {e}")

    # Process request normally
    response = await call_next(request)

    # Cache successful responses
    if response.status_code == 200:
        try:
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            cache_key = f"cache:{request.method}:{request.url.path}:{request.url.query}"

            # Get response content
            if hasattr(response, "body"):
                content = response.body.decode()
                await redis_client.setex(cache_key, settings.REDIS_TTL, content)
                response.headers["X-Cache"] = "MISS"

            await redis_client.close()
        except Exception as e:
            logger.warning(f"Cache set error: {e}")

    return response


async def rate_limiting_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Middleware for rate limiting."""
    client_ip = request.client.host if request.client else "unknown"

    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        rate_limit_key = f"rate_limit:{client_ip}"

        # Get current request count
        current_count = await redis_client.get(rate_limit_key)
        current_count = int(current_count) if current_count else 0

        # Check rate limit (100 requests per minute)
        if current_count >= 100:
            logger.warning("Rate limit exceeded", client_ip=client_ip)
            await redis_client.close()
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
            )

        # Increment counter
        await redis_client.incr(rate_limit_key)
        await redis_client.expire(rate_limit_key, 60)  # 1 minute window

        await redis_client.close()
    except Exception as e:
        logger.warning(f"Rate limiting error: {e}")

    return await call_next(request)


async def error_handling_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    """Middleware for error handling."""
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(
            "Unhandled exception in middleware",
            method=request.method,
            path=request.url.path,
            error=str(e),
            exc_info=True,
        )

        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "timestamp": time.time(),
            },
        )
