from collections.abc import Generator

from cactus_wealth.core.config import settings
from sqlmodel import Session, SQLModel, StaticPool, create_engine
from sqlalchemy.engine import Engine

_engine = None


def get_engine(db_url: str = None) -> Engine:
    global _engine
    if _engine is not None:
        return _engine
    db_url = db_url or settings.DATABASE_URL
    if "sqlite" in db_url:
        _engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        _engine = create_engine(
            db_url,
            echo=False,
            pool_size=20,
            max_overflow=30,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={
                "connect_timeout": 10,
                "application_name": "cactus_wealth_backend",
            },
        )
    return _engine


def create_tables() -> None:
    """Create all tables in the database."""
    # Import models to register them with the cleared metadata
    # Eliminar: from cactus_wealth.models import (
    # Eliminar:     Asset,
    # Eliminar:     Client,
    # Eliminar:     ClientActivity,
    # Eliminar:     ClientNote,
    # Eliminar:     InsurancePolicy,
    # Eliminar:     InvestmentAccount,
    # Eliminar:     ModelPortfolio,
    # Eliminar:     ModelPortfolioPosition,
    # Eliminar:     Notification,
    # Eliminar:     Portfolio,
    # Eliminar:     PortfolioSnapshot,
    # Eliminar:     Position,
    # Eliminar:     Report,
    # Eliminar:     User,
    # )

    # Create tables
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session with proper transaction handling."""
    session = Session(get_engine(), autoflush=True, autocommit=False)
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
