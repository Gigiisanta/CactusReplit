# Mover test_health_endpoint.py aquí desde raíz de tests
# ... código existente ...
from fastapi.testclient import TestClient
import pytest

def test_health_endpoint_error(monkeypatch):
    from main import app
    client = TestClient(app)

    # Simular fallo de base de datos
    def fail_db(*args, **kwargs):
        raise Exception("DB down")
    monkeypatch.setattr("cactus_wealth.database.get_session", lambda: iter([fail_db]))

    response = client.get("/health")
    data = response.json()
    assert response.status_code == 200
    assert data["services"]["database"] == "unhealthy" 