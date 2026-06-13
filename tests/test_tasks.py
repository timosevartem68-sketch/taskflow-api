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


def create_task(
    client,
    headers,
    *,
    project_id: int,
    title: str = "Main Task",
    description: str = "Task description",
    priority: str = "medium",
    assignee_id: int | None = None,
    due_date: str | None = None,
) -> dict:
    response = client.post(
        "/api/v1/tasks",
        json={
            "project_id": project_id,
            "title": title,
            "description": description,
            "priority": priority,
            "assignee_id": assignee_id,
            "due_date": due_date,
        },
        headers=headers,
    )

    assert response.status_code == 201

    return response.json()


def prepare_project(client):
    headers = create_auth_headers(client)
    workspace = create_workspace(client, headers)
    project = create_project(
        client,
        headers,
        workspace_id=workspace["id"],
    )

    return headers, workspace, project


def test_create_task(client):
    headers, _workspace, project = prepare_project(client)

    response = client.post(
        "/api/v1/tasks",
        json={
            "project_id": project["id"],
            "title": "Main Task",
            "description": "Task description",
            "priority": "medium",
            "assignee_id": None,
            "due_date": None,
        },
        headers=headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["project_id"] == project["id"]
    assert data["title"] == "Main Task"
    assert data["description"] == "Task description"
    assert data["priority"] == "medium"
    assert data["status"] == "todo"
    assert data["assignee_id"] is None
    assert "id" in data


def test_list_tasks(client):
    headers, _workspace, project = prepare_project(client)

    create_task(
        client,
        headers,
        project_id=project["id"],
        title="First Task",
    )

    create_task(
        client,
        headers,
        project_id=project["id"],
        title="Second Task",
    )

    response = client.get(
        f"/api/v1/tasks?project_id={project['id']}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert data["limit"] == 20
    assert data["offset"] == 0
    assert len(data["items"]) == 2
    assert data["items"][0]["project_id"] == project["id"]


def test_get_task_by_id(client):
    headers, _workspace, project = prepare_project(client)

    task = create_task(
        client,
        headers,
        project_id=project["id"],
    )

    response = client.get(
        f"/api/v1/tasks/{task['id']}",
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task["id"]
    assert data["project_id"] == project["id"]
    assert data["title"] == "Main Task"


def test_update_task(client):
    headers, _workspace, project = prepare_project(client)

    task = create_task(
        client,
        headers,
        project_id=project["id"],
        title="Old Task",
        description="Old description",
        priority="low",
    )

    response = client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={
            "title": "New Task",
            "description": "New description",
            "status": "in_progress",
            "priority": "high",
            "assignee_id": None,
            "due_date": None,
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task["id"]
    assert data["title"] == "New Task"
    assert data["description"] == "New description"
    assert data["status"] == "in_progress"
    assert data["priority"] == "high"


def test_update_task_status(client):
    headers, _workspace, project = prepare_project(client)

    task = create_task(
        client,
        headers,
        project_id=project["id"],
    )

    response = client.patch(
        f"/api/v1/tasks/{task['id']}/status",
        json={
            "status": "done",
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task["id"]
    assert data["status"] == "done"


def test_update_task_assignee(client):
    headers, _workspace, project = prepare_project(client)

    me_response = client.get(
        "/api/v1/auth/me",
        headers=headers,
    )

    assert me_response.status_code == 200

    user_id = me_response.json()["id"]

    task = create_task(
        client,
        headers,
        project_id=project["id"],
    )

    response = client.patch(
        f"/api/v1/tasks/{task['id']}/assignee",
        json={
            "assignee_id": user_id,
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == task["id"]
    assert data["assignee_id"] == user_id


def test_delete_task(client):
    headers, _workspace, project = prepare_project(client)

    task = create_task(
        client,
        headers,
        project_id=project["id"],
    )

    delete_response = client.delete(
        f"/api/v1/tasks/{task['id']}",
        headers=headers,
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/tasks/{task['id']}",
        headers=headers,
    )

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Задача не найдена"


def test_list_tasks_without_project_id_returns_422(client):
    headers = create_auth_headers(client)

    response = client.get(
        "/api/v1/tasks",
        headers=headers,
    )

    assert response.status_code == 422


def test_create_task_without_token_returns_401(client):
    response = client.post(
        "/api/v1/tasks",
        json={
            "project_id": 1,
            "title": "Main Task",
            "description": "Task description",
            "priority": "medium",
            "assignee_id": None,
            "due_date": None,
        },
    )

    assert response.status_code == 401