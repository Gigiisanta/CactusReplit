import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Cactus Wealth Dashboard API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://cactus_user:cactus_password@localhost:5432/cactus_db"
    
    # CORS settings
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Security settings
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"


settings = Settings() 