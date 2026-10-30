"""Django settings for the TrustShield 254 API."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


DEBUG = env_bool("DJANGO_DEBUG", False)
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY") or ("dev-insecure-key-do-not-use-in-production" if DEBUG else None)
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is false.")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")

# Automatically accept Render's external URL (set by Render at runtime)
_render_external = os.environ.get("RENDER_EXTERNAL_URL", "")
if _render_external:
    from urllib.parse import urlparse
    _host = urlparse(_render_external).hostname
    if _host and _host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_host)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "apps.core",
    "apps.accounts",
    "apps.scans",
    "apps.guidance",
    "apps.incidents",
    "apps.reports",
    "apps.community",
    "apps.trainer",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_USER_MODEL = "accounts.User"
# Argon2 first: memory-hard and fast enough for interactive logins. Older
# PBKDF2 hashes keep working and are upgraded on the user's next login.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Nairobi"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- API -------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.TokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.PagePagination",
    "PAGE_SIZE": 10,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "240/min",
        "auth": "10/min",
        "scan": "30/min",
        "report": "10/hour",
    },
    "EXCEPTION_HANDLER": "apps.core.exceptions.api_exception_handler",
    # Return money amounts as JSON numbers so the frontend never parses strings.
    "COERCE_DECIMAL_TO_STRING": False,
}
if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append("rest_framework.renderers.BrowsableAPIRenderer")

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")
CORS_ALLOWED_ORIGIN_REGEXES = env_list(
    "CORS_ALLOWED_ORIGIN_REGEXES",
    r"^https://.*\.onrender\.com$",
)
CORS_URLS_REGEX = r"^/api/.*$"

# --- Security (tightened automatically outside DEBUG) ------------------------
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30

# --- TrustShield analysis ------------------------------------------------------
# The AI-ML module lives outside the Django project and is imported, not copied.
ML_SRC_DIR = Path(os.environ.get("ML_SRC_DIR") or PROJECT_ROOT / "AI-ML" / "src")
ML_MODELS_DIR = Path(os.environ.get("ML_MODELS_DIR") or PROJECT_ROOT / "AI-ML" / "models")
ML_PRELOAD = env_bool("ML_PRELOAD", True)
ML_ENABLED = env_bool("ML_ENABLED", True)

LLM_API_BASE = os.environ.get("LLM_API_BASE", "").rstrip("/")
LLM_MODEL = os.environ.get("LLM_MODEL", "qwen2.5:7b-instruct")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_TIMEOUT_SECONDS = float(os.environ.get("LLM_TIMEOUT_SECONDS", "8"))

SCAN_MAX_CONTENT_LENGTH = 5000
# Key for hashing phone numbers and domains in community memory. Changing it
# resets the memory, so set it explicitly in production rather than relying on SECRET_KEY.
INDICATOR_HASH_KEY = os.environ.get("INDICATOR_HASH_KEY") or SECRET_KEY
# Scam Pulse hides any group smaller than this, so trends never point to individuals.
PULSE_MIN_GROUP = 3
GUIDANCE_REVIEWED_ON = "2026-10-23"

# --- Email (password reset, weekly summaries) --------------------------------
# Development prints emails to the console. Set EMAIL_HOST etc. for real delivery.
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "TrustShield 254 <no-reply@trustshield254.ke>")
# Where links in emails point (the React app)
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")

# --- Static files (WhiteNoise for production) --------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
WHITENOISE_MAX_AGE = 31536000  # 1 year cache for static assets

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simple": {"format": "%(levelname)s %(name)s: %(message)s"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simple"}},
    "loggers": {"apps": {"handlers": ["console"], "level": "INFO"}},
}
