import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("apps.core")


def api_exception_handler(exc, context):
    """Use DRF's error format, and never leak a stack trace for unexpected errors."""
    response = exception_handler(exc, context)
    if response is not None:
        return response
    logger.exception("Unhandled API error", exc_info=exc)
    return Response({"detail": "Something went wrong on our side. Please try again."}, status=500)
