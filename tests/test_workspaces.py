from tests.helpers import create_auth_headers


def test_create_workspace(client):
    headers = create_auth_headers(client)

    response = client.post(
        "/api/v1/workspaces",
        json={
            "name": "Main Workspace",
        },
        headers=headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Main Workspace"
    assert "id" in data


def test_list_workspaces(client):
    headers = create_auth_headers(client)

    client.post(
        "/api/v1/workspaces",
        json={
            "name": "Main Workspace",
        },
        headers=headers,
    )

    response = client.get(
        "/api/v1/workspaces",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Main Workspace"


def test_get_workspace_by_id(client):
    headers = create_auth_headers(client)

    create_response = client.post(
        "/api/v1/workspaces",
        json={
            "name": "Main Workspace",
        },
        headers=headers,
    )

    workspace_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/workspaces/{workspace_id}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == workspace_id
    assert data["name"] == "Main Workspace"


def test_update_workspace(client):
    headers = create_auth_headers(client)

    create_response = client.post(
        "/api/v1/workspaces",
        json={
            "name": "Old Workspace Name",
        },
        headers=headers,
    )

    workspace_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/workspaces/{workspace_id}",
        json={
            "name": "New Workspace Name",
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == workspace_id
    assert data["name"] == "New Workspace Name"


def test_get_workspace_without_token_returns_401(client):
    response = client.get("/api/v1/workspaces/1")

    assert response.status_code == 401