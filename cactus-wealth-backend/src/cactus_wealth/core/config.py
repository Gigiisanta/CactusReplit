"""
Configuration settings for the Cactus Wealth application.
"""

import os
from typing import List

from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""

    # Basic app settings
    PROJECT_NAME: str = "Cactus Wealth"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    TESTING: bool = bool(os.getenv("TESTING", "0") == "1")

    # API settings
    API_V1_STR: str = "/api/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://cactus_user:cactus_pass@db:5432/cactus_wealth")

    # Redis settings for caching
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_TTL: int = 300  # 5 minutes default TTL

    # Security settings
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Performance settings
    MAX_CONNECTIONS: int = 20
    CONNECTION_TIMEOUT: int = 10
    REQUEST_TIMEOUT: int = 30

    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # CORS settings
    @validator("ALLOWED_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database optimization settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True

    # PostgreSQL specific settings
    POSTGRES_SHARED_BUFFERS: str = "256MB"
    POSTGRES_EFFECTIVE_CACHE_SIZE: str = "1GB"
    POSTGRES_WORK_MEM: str = "4MB"
    POSTGRES_MAINTENANCE_WORK_MEM: str = "64MB"
    POSTGRES_MAX_CONNECTIONS: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
elif os.getenv("ENVIRONMENT") == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
