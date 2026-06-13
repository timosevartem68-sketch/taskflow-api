def create_auth_headers(
    client,
    *,
    email: str = "test@example.com",
    password: str = "secret123",
) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Test User",
        },
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    token = login_response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}",
    }