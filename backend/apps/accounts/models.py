from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


def default_preferences():
    return {"save_scan_text": False, "weekly_summary": True}


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("An email address is required.")
        user = self.model(email=self.normalize_email(email).lower(), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True)
        return self._create_user(email, password, **extra)


class User(AbstractUser):
    """Signs in with email (or phone); there is no separate username."""

    username = None
    first_name = None
    last_name = None
    email = models.EmailField("email address", unique=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    preferences = models.JSONField(default=default_preferences)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def saves_scan_text(self):
        return bool(self.preferences.get("save_scan_text", False))
