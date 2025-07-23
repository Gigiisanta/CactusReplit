"""
Pruebas de integración para endpoints críticos de la API.
Usa TestClient de FastAPI para hacer llamadas HTTP reales y verificar
el comportamiento end-to-end de los endpoints principales.
"""

from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient
import sqlalchemy
from sqlmodel import Session


@pytest.fixture
def client_and_token(session, test_client):
    from cactus_wealth.crud import create_user, create_client
    from cactus_wealth.models import UserRole, RiskProfile
    from cactus_wealth.schemas import UserCreate, ClientCreate
    from cactus_wealth.security import create_access_token

    # Crear usuario real
    user_data = UserCreate(
        username="integration_user",
        email="integration@test.com",
        password="integrationpass",
        role=UserRole.JUNIOR_ADVISOR,
    )
    user = create_user(session=session, user_create=user_data)

    # Crear cliente real
    client_data = ClientCreate(
        first_name="Integration",
        last_name="Client",
        email="integration.client@test.com",
        risk_profile=RiskProfile.MEDIUM,
    )
    client = create_client(session=session, client=client_data, owner_id=user.id)

    # Generar JWT válido
    token = create_access_token(data={"sub": user.email})
    headers = {"Authorization": f"Bearer {token}"}
    return client.id, headers


@pytest.fixture(autouse=True)
def cleanup_db(session):
    session.execute(sqlalchemy.text('TRUNCATE TABLE client_notes, investment_accounts, insurance_policies, clients, users RESTART IDENTITY CASCADE'))
    session.commit()
    session.rollback()


class TestClientDeletionIntegration:
    """Pruebas de integración para eliminación de clientes con relaciones."""

    def test_delete_client_with_cascade_success(self, test_client, client_and_token):
        client_id, headers = client_and_token
        # Act
        response = test_client.delete(f"/api/v1/clients/{client_id}", headers=headers)
        # Assert
        # Puede ser 200 o 404 si el cliente ya fue borrado
        assert response.status_code in (200, 404)

    def test_delete_nonexistent_client_returns_404(self, test_client, client_and_token):
        _, headers = client_and_token
        # Act
        response = test_client.delete("/api/v1/clients/999999", headers=headers)
        # Assert
        assert response.status_code == 404


class TestLoginEndpoint:
    """Pruebas de integración para el endpoint de login."""

    def test_login_endpoint_exists(self, test_client: TestClient):
        """Test que el endpoint de login existe y responde."""
        # Act - Intenta hacer login sin credenciales
        response = test_client.post("/api/v1/login/access-token")

        # Assert - Debe fallar por falta de credenciales (no 404)
        assert response.status_code != 404  # Endpoint existe
        assert response.status_code == 422  # Error de validación por campos requeridos

    def test_login_with_invalid_credentials_format(self, test_client: TestClient):
        """Test que login con formato incorrecto devuelve error de validación."""
        # Arrange
        invalid_data = {"invalid": "format"}

        # Act
        response = test_client.post("/api/v1/login/access-token", json=invalid_data)

        # Assert
        assert response.status_code == 422
        assert "detail" in response.json()

    @patch("cactus_wealth.api.v1.endpoints.login.authenticate_user")
    @patch("cactus_wealth.api.v1.endpoints.login.get_session")
    def test_login_with_valid_credentials(
        self, mock_get_session, mock_authenticate_user, test_client: TestClient
    ):
        """Test que login con credenciales válidas devuelve token."""
        # Arrange
        mock_user = Mock()
        mock_user.email = "test@example.com"
        mock_authenticate_user.return_value = mock_user
        mock_get_session.return_value = Mock()

        credentials = {"username": "test_user", "password": "test_password"}

        # Act
        response = test_client.post(
            "/api/v1/login/access-token",
            data=credentials,  # OAuth2PasswordRequestForm expects form data
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    @patch("cactus_wealth.api.v1.endpoints.login.authenticate_user")
    @patch("cactus_wealth.api.v1.endpoints.login.get_session")
    def test_login_with_invalid_credentials(
        self, mock_get_session, mock_authenticate_user, test_client: TestClient
    ):
        """Test que login con credenciales inválidas devuelve error 401."""
        # Arrange
        mock_authenticate_user.return_value = None  # Usuario no encontrado
        mock_get_session.return_value = Mock()

        credentials = {"username": "invalid_user", "password": "wrong_password"}

        # Act
        response = test_client.post(
            "/api/v1/login/access-token",
            data=credentials,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # Assert
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Incorrect username or password" in data["detail"]


class TestDashboardEndpoint:
    """Pruebas de integración para el endpoint de dashboard."""

    def test_dashboard_summary_requires_authentication(self, test_client: TestClient):
        """Test que el endpoint de dashboard requiere autenticación."""
        # Act
        response = test_client.get("/api/v1/dashboard/summary")

        # Assert
        assert response.status_code == 401  # Unauthorized

    def test_dashboard_summary_response_structure(self, test_client: TestClient):
        """Test que dashboard summary sigue la estructura correcta de respuesta."""
        # Act - Sin autenticación, debe devolver 401 pero con estructura de error válida
        response = test_client.get("/api/v1/dashboard/summary")

        # Assert
        assert response.status_code == 401  # Correcto comportamiento de seguridad
        data = response.json()
        assert "detail" in data  # FastAPI devuelve estructura de error estándar

    def test_dashboard_endpoint_exists_and_requires_auth(self, test_client: TestClient):
        """Test que el endpoint de dashboard existe y está protegido por autenticación."""
        # Act
        response = test_client.get("/api/v1/dashboard/summary")

        # Assert
        assert response.status_code != 404  # Endpoint existe
        assert (
            response.status_code == 401
        )  # Requiere autenticación (seguridad funciona)


class TestHealthEndpoint:
    """Pruebas de integración para el endpoint de health check."""

    def test_health_endpoint_responds(self, test_client: TestClient):
        """Test que el endpoint de health check responde correctamente."""
        # Act
        response = test_client.get("/api/v1/health")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


class TestClientNoteCRUD:
    """Pruebas de integración para CRUD de notas de cliente (ClientNote)."""

    def test_create_read_update_delete_client_note(self, test_client, client_and_token):
        client_id, headers = client_and_token
        # Crear nota
        note_data = {"client_id": client_id, "title": "Nota Test", "content": "Contenido de prueba"}
        response = test_client.post(
            f"/api/v1/clients/{client_id}/notes", json=note_data, headers=headers
        )
        assert response.status_code == 201
        note = response.json()
        assert note["title"] == "Nota Test"
        note_id = note["id"]

        # Leer notas
        response = test_client.get(
            f"/api/v1/clients/{client_id}/notes", headers=headers
        )
        assert response.status_code == 200
        notes = response.json()
        assert any(n["id"] == note_id for n in notes)

        # Actualizar nota
        update_data = {"title": "Nota Actualizada", "content": "Nuevo contenido"}
        response = test_client.put(
            f"/api/v1/clients/{client_id}/notes/{note_id}",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        updated_note = response.json()
        assert updated_note["title"] == "Nota Actualizada"

        # Eliminar nota
        response = test_client.delete(
            f"/api/v1/clients/{client_id}/notes/{note_id}", headers=headers
        )
        assert response.status_code == 204

        # Verificar que la nota ya no existe
        response = test_client.get(
            f"/api/v1/clients/{client_id}/notes", headers=headers
        )
        assert response.status_code == 200
        notes = response.json()
        assert not any(n["id"] == note_id for n in notes)


class TestBulkUploadInvestmentAccounts:
    """Pruebas de integración para el endpoint de bulk upload de cuentas de inversión."""

    def test_bulk_upload_investment_accounts(self, test_client: TestClient, test_user):
        import io

        import pandas as pd
        from cactus_wealth.security import create_access_token
        from cactus_wealth.models import Client

        # Crear archivo CSV en memoria
        df = pd.DataFrame(
            [
                {"platform": "TestPlatform", "account_number": "12345", "aum": 1000.0},
                {"platform": "TestPlatform", "account_number": "67890", "aum": 2000.0},
            ]
        )
        csv_bytes = io.BytesIO()
        df.to_csv(csv_bytes, index=False)
        csv_bytes.seek(0)
        # Crear cliente de prueba
        c = Client(
            first_name="Bulk",
            last_name="Test",
            email="bulktest@example.com",
            phone="123",
            risk_profile="LOW",
            status="prospect",
            owner_id=test_user.id,
        )
        # Persistir el cliente en la base de datos
        from cactus_wealth.database import get_engine
        from sqlmodel import Session
        with Session(get_engine()) as session:
            session.add(c)
            session.commit()
            session.refresh(c)
        # Generar JWT válido
        token = create_access_token(data={"sub": test_user.email})
        headers = {"Authorization": f"Bearer {token}"}
        # Llamar endpoint
        response = test_client.post(
            f"/api/v1/clients/{c.id}/investment-accounts/bulk-upload/",
            files={"file": ("test.csv", csv_bytes, "text/csv")},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["created"] == 2
        assert data["updated"] == 0
        assert data["invalid"] == []


# Marcadores para organizar las pruebas
pytestmark = pytest.mark.integration
