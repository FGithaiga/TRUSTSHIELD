import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture(autouse=True)
def _no_throttle(settings):
    # Throttle counters live in the cache and would leak between tests.
    settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": []}
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
    from django.core.cache import cache

    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="wanjiru@example.com", password="Str0ng-Pass!", full_name="Wanjiru Kamau", phone="0712345678")


@pytest.fixture
def auth_client(user):
    c = APIClient()
    c.force_authenticate(user)
    return c
