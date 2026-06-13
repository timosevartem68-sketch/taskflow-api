from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_openapi_schema_is_available():
    response = client.get("/openapi.json")

    assert response.status_code == 200

    data = response.json()

    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == app.title


def test_health_check_is_available():
    response = client.get("/health")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)