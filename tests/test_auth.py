def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "secret123",
            "full_name": "Test User",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["is_active"] is True
    assert "hashed_password" not in data


def test_register_user_with_existing_email_returns_409(client):
    payload = {
        "email": "test@example.com",
        "password": "secret123",
        "full_name": "Test User",
    }

    first_response = client.post("/api/v1/auth/register", json=payload)
    second_response = client.post("/api/v1/auth/register", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Пользователь с таким email уже существует"


def test_login_user(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "secret123",
            "full_name": "Test User",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "secret123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_wrong_password_returns_401(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "secret123",
            "full_name": "Test User",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Неверный email или пароль"


def test_get_me_with_token(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "secret123",
            "full_name": "Test User",
        },
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "secret123",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"