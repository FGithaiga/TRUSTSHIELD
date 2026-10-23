import os
import sys
import threading

from django.apps import AppConfig
from django.conf import settings


class CoreConfig(AppConfig):
    name = "apps.core"

    def ready(self):
        # Warm the ML models in the background for server processes only, so the
        # first user request does not wait several seconds for joblib to load.
        is_server = "runserver" in sys.argv or "gunicorn" in sys.argv[0] or "uvicorn" in sys.argv[0]
        reloader_child = os.environ.get("RUN_MAIN") == "true" or "runserver" not in sys.argv
        if settings.ML_PRELOAD and is_server and reloader_child:
            from apps.scans.analysis import ml

            threading.Thread(target=ml.warm_up, name="ml-warmup", daemon=True).start()
