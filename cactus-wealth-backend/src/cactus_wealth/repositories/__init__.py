"""
Repository pattern implementation for data access layer.

This package contains all repository classes that handle database operations,
providing a clean separation between business logic and data persistence.
"""

from .base_repository import BaseRepository
from .portfolio_repository import PortfolioRepository
from .client_repository import ClientRepository
from .asset_repository import AssetRepository
from .user_repository import UserRepository
from .notification_repository import NotificationRepository

__all__ = [
    "BaseRepository",
    "PortfolioRepository", 
    "ClientRepository",
    "AssetRepository",
    "UserRepository",
    "NotificationRepository",
] 