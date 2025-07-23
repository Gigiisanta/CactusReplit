"""
Repository pattern implementation for data access layer.

This package contains all repository classes that handle database operations,
providing a clean separation between business logic and data persistence.
"""

from .asset_repository import AssetRepository
from .base_repository import BaseRepository
from .client_repository import ClientRepository
from .notification_repository import NotificationRepository
from .portfolio_repository import PortfolioRepository
from .user_repository import UserRepository

__all__ = [
    "BaseRepository",
    "PortfolioRepository",
    "ClientRepository",
    "AssetRepository",
    "UserRepository",
    "NotificationRepository",
]
