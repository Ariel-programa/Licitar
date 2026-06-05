import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="testuser",
        email="test@licitar.ar",
        password="testpass123",
        role="viewer",
    )


@pytest.mark.django_db
def test_register(api_client):
    response = api_client.post("/api/auth/register/", {
        "username": "nuevo",
        "email": "nuevo@licitar.ar",
        "password": "newpass123",
        "empresa": "Empresa SA",
    })
    assert response.status_code == 201


@pytest.mark.django_db
def test_login(api_client, user):
    response = api_client.post("/api/auth/login/", {
        "email": "test@licitar.ar",
        "password": "testpass123",
    })
    assert response.status_code == 200
    assert "access" in response.data


@pytest.mark.django_db
def test_me_autenticado(api_client, user):
    api_client.force_authenticate(user=user)
    response = api_client.get("/api/auth/me/")
    assert response.status_code == 200
    assert response.data["email"] == "test@licitar.ar"
