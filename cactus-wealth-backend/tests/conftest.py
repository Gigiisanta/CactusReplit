"""
Fixtures globales para testing del backend Cactus Wealth.
Configuración de base de datos de test, mocks y fixtures reutilizables.
"""

import os
import sys
from unittest.mock import AsyncMock, Mock

import pytest
import pytest_asyncio
from cactus_wealth import database
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from pathlib import Path
import subprocess
import sqlalchemy
import re
from sqlalchemy_utils import create_database, drop_database, database_exists

# Agregar src al path para importaciones
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import os
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/cactus_test"
os.environ["TESTING"] = "1"
from cactus_wealth import database
from sqlmodel import create_engine

test_engine = create_engine(os.environ["DATABASE_URL"])
database._engine = test_engine
database.engine = test_engine

# Eliminar setup_test_db fixture y test_engine

# Eliminar pytest_sessionstart

# --- PATCH: Soporte xdist paralelo por base de datos ---
@pytest.fixture(scope="session", autouse=True)
def _setup_xdist_db(request):
    worker_id = os.environ.get("PYTEST_XDIST_WORKER", "gw0")
    base_db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cactus_test")
    match = re.match(r"(.+/)([^/]+)$", base_db_url)
    if not match:
        raise RuntimeError(f"DATABASE_URL malformado: {base_db_url}")
    db_prefix, db_name = match.groups()
    worker_db = f"{db_prefix}{db_name}_{worker_id}"
    os.environ["DATABASE_URL"] = worker_db
    # Crear base de datos si no existe
    if not database_exists(worker_db):
        create_database(worker_db)
    # Migrar schema
    engine = create_engine(worker_db)
    SQLModel.metadata.create_all(engine)
    yield
    # Limpiar base de datos al finalizar
    drop_database(worker_db)

@pytest.fixture(scope="function")
def session():
    engine = create_engine(os.environ["DATABASE_URL"])
    with Session(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def mock_session() -> Mock:
    """Mock de SQLModel Session para pruebas unitarias de repositorios."""
    session = Mock(spec=Session)
    session.add = Mock()
    session.commit = Mock()
    session.refresh = Mock()
    session.delete = Mock()
    session.exec = Mock()
    session.close = Mock()
    return session


@pytest.fixture
def portfolio_repository(mock_session: Mock):
    """Repositorio de Portfolio con session mockeada."""
    from cactus_wealth.repositories.portfolio_repository import PortfolioRepository

    return PortfolioRepository(session=mock_session)


@pytest.fixture
def client_repository(mock_session: Mock):
    """Repositorio de Client con session mockeada."""
    from cactus_wealth.repositories.client_repository import ClientRepository

    return ClientRepository(session=mock_session)


@pytest.fixture
def asset_repository(mock_session: Mock):
    """Repositorio de Asset con session mockeada."""
    from cactus_wealth.repositories.asset_repository import AssetRepository

    return AssetRepository(session=mock_session)


@pytest.fixture
def user_repository(mock_session: Mock):
    """Repositorio de User con session mockeada."""
    from cactus_wealth.repositories.user_repository import UserRepository

    return UserRepository(session=mock_session)


@pytest.fixture
def notification_repository(mock_session: Mock):
    """Repositorio de Notification con session mockeada."""
    from cactus_wealth.repositories.notification_repository import (
        NotificationRepository,
    )

    return NotificationRepository(session=mock_session)


@pytest_asyncio.fixture
async def async_mock_session() -> AsyncMock:
    """Mock asíncrono de Session para pruebas async."""
    session = AsyncMock(spec=Session)
    session.add = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.exec = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest.fixture
def test_client():
    """Cliente HTTP para pruebas de integración."""
    from cactus_wealth.api.v1.api import api_router
    from fastapi import FastAPI

    app = FastAPI(title="Test API")
    app.include_router(api_router, prefix="/api/v1")

    return TestClient(app)


@pytest.fixture
def test_user_credentials():
    """Credenciales de usuario de prueba."""
    return {"username": "test_user", "password": "test_password"}


@pytest.fixture(scope="function")
def test_admin(session):
    from cactus_wealth.crud import create_user
    from cactus_wealth.models import UserRole
    from cactus_wealth.schemas import UserCreate

    user_data = UserCreate(
        username="admin",
        email="admin@test.com",
        password="adminpass",
        role=UserRole.ADMIN,
    )
    return create_user(session=session, user_create=user_data)


@pytest.fixture(scope="function")
def test_user(session):
    from cactus_wealth.crud import create_user
    from cactus_wealth.models import UserRole
    from cactus_wealth.schemas import UserCreate

    user_data = UserCreate(
        username="test_user",
        email="user@test.com",
        password="testpass",
        role=UserRole.JUNIOR_ADVISOR,
    )
    return create_user(session=session, user_create=user_data)


@pytest.fixture(scope="function")
def another_user(session):
    from cactus_wealth.crud import create_user
    from cactus_wealth.models import UserRole
    from cactus_wealth.schemas import UserCreate

    user_data = UserCreate(
        username="another_user",
        email="another@test.com",
        password="anotherpass",
        role=UserRole.JUNIOR_ADVISOR,
    )
    return create_user(session=session, user_create=user_data)


@pytest.fixture(scope="function")
def test_client_db(session, test_user):
    from cactus_wealth.crud import create_client
    from cactus_wealth.models import RiskProfile
    from cactus_wealth.schemas import ClientCreate

    client_data = ClientCreate(
        first_name="Test",
        last_name="Client",
        email="client@test.com",
        risk_profile=RiskProfile.MEDIUM,
    )
    return create_client(session=session, client=client_data, owner_id=test_user.id)


@pytest.fixture(scope="function")
def auth_headers(test_user):
    from cactus_wealth.security import create_access_token

    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True, scope="function")
def cleanup_db(session):
    engine = session.get_bind()
    if engine.dialect.name == "postgresql":
        tables = session.execute(sqlalchemy.text("""
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        """)).scalars().all()
        if tables:
            session.execute(sqlalchemy.text(f'TRUNCATE TABLE {", ".join(tables)} RESTART IDENTITY CASCADE'))
            session.commit()
    elif engine.dialect.name == "sqlite":
        tables = session.execute(sqlalchemy.text("""
            SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
        """)).scalars().all()
        for table in tables:
            session.execute(sqlalchemy.text(f'DELETE FROM {table}'))
        session.commit()
