"""
Main API router for CactusDashboard v1
"""

from fastapi import APIRouter

from cactus_wealth.api.v1.endpoints import health

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
