from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.scans.analysis import explainer, ml


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    try:
        connection.ensure_connection()
        database = "ok"
    except Exception:  # pragma: no cover - reported, not raised
        database = "unavailable"
    status = ml.status()
    return Response(
        {
            "status": "ok" if database == "ok" else "degraded",
            "mode": "live",
            "database": database,
            "models_loaded": status["loaded"],
            "models": status["models"],
            "model_error": status["error"],
            "llm_explainer": explainer.is_enabled(),
        }
    )
