from tests.helpers import create_auth_headers


def create_workspace(client, headers, name: str = "Main Workspace") -> dict:
    response = client.post(
        "/api/v1/workspaces",
        json={
            "name": name,
        },
        headers=headers,
    )

    assert response.status_code == 201

    return response.json()


def create_project(
    client,
    headers,
    *,
    workspace_id: int,
    name: str = "Main Project",
    description: str = "Project description",
) -> dict:
    response = client.post(
        "/api/v1/projects",
        json={
            "workspace_id": workspace_id,
            "name": name,
            "description": description,
        },
        headers=headers,
    )

    assert response.status_code == 201

    return response.json()


def test_create_project(client):
    headers = create_auth_headers(client)
    workspace = create_workspace(client, headers)

    response = client.post(
        "/api/v1/projects",
        json={
            "workspace_id": workspace["id"],
            "name": "Main Project",
            "description": "Project description",
        },
        headers=headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["workspace_id"] == workspace["id"]
    assert data["name"] == "Main Project"
    assert data["description"] == "Project description"
    assert "id" in data


def test_list_projects(client):
    headers = create_auth_headers(client)
    workspace = create_workspace(client, headers)

    create_project(
        client,
        headers,
        workspace_id=workspace["id"],
        name="Main Project",
    )

    response = client.get(
        f"/api/v1/projects?workspace_id={workspace['id']}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["workspace_id"] == workspace["id"]
    assert data[0]["name"] == "Main Project"


def test_get_project_by_id(client):
    headers = create_auth_headers(client)
    workspace = create_workspace(client, headers)

    project = create_project(
        client,
        headers,
        workspace_id=workspace["id"],
    )

    response = client.get(
        f"/api/v1/projects/{project['id']}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == project["id"]
    assert data["workspace_id"] == workspace["id"]
    assert data["name"] == "Main Project"


def test_update_project(client):
    headers = create_auth_headers(client)
    workspace = create_workspace(client, headers)

    project = create_project(
        client,
        headers,
        workspace_id=workspace["id"],
        name="Old Project Name",
        description="Old description",
    )

    response = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={
            "name": "New Project Name",
            "description": "New description",
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == project["id"]
    assert data["name"] == "New Project Name"
    assert data["description"] == "New description"


def test_delete_project(client):
    headers = create_auth_headers(client)
    workspace = create_workspace(client, headers)

    project = create_project(
        client,
        headers,
        workspace_id=workspace["id"],
    )

    delete_response = client.delete(
        f"/api/v1/projects/{project['id']}",
        headers=headers,
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/projects/{project['id']}",
        headers=headers,
    )

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Проект не найден"


def test_create_project_without_token_returns_401(client):
    response = client.post(
        "/api/v1/projects",
        json={
            "workspace_id": 1,
            "name": "Main Project",
            "description": "Project description",
        },
    )

    assert response.status_code == 401