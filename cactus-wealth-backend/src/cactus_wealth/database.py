from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from cactus_wealth.core.config import settings

# Create the engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)


def create_tables() -> None:
    """Create all tables in the database."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session 