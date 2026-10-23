"""Adapter between the API and the team's AI-ML model service.

The models and `AI-ML/src/model_service.py` are owned by the ML workstream and
are imported from their original location, never copied or modified here. This
adapter only calls the module's public prediction functions, adds a model
version for traceability, and turns failures into a "model unavailable" result
so the rule checks keep working.
"""
import hashlib
import importlib
import logging
import sys
import threading
import time

from django.conf import settings

logger = logging.getLogger("apps.scans.ml")

ARTIFACTS = {
    "sms_spam": ["sms_spam_model.pkl", "sms_vectorizer.pkl"],
    "fake_job": ["fake_job_model.pkl", "fake_job_preprocessor.pkl"],
    "phishing_url": ["phishing_model.pkl"],
}

# The fake-job preprocessor was trained with "Unknown" for missing categories.
# A pasted advert has none of this metadata, so the request is completed with
# the same placeholder the training data used.
JOB_CATEGORICAL = [
    "location", "department", "salary_range", "employment_type",
    "required_experience", "required_education", "industry", "function",
]

_lock = threading.Lock()
_state = {"service": None, "loaded": False, "error": None, "versions": {}, "load_seconds": None}


def _fingerprint(files):
    digest = hashlib.sha256()
    for name in files:
        path = settings.ML_MODELS_DIR / name
        digest.update(path.read_bytes())
    return digest.hexdigest()[:8]


def _load():
    """Import model_service and load all artifacts once. Thread-safe."""
    if _state["loaded"] or _state["error"]:
        return _state["service"]
    with _lock:
        if _state["loaded"] or _state["error"]:
            return _state["service"]
        if not settings.ML_ENABLED:
            _state["error"] = "ML models are disabled by configuration."
            return None
        started = time.monotonic()
        try:
            src = str(settings.ML_SRC_DIR)
            if src not in sys.path:
                sys.path.insert(0, src)
            # Never write __pycache__ into the AI-ML folder: it belongs to the ML workstream.
            previous, sys.dont_write_bytecode = sys.dont_write_bytecode, True
            try:
                service = importlib.import_module("model_service")
            finally:
                sys.dont_write_bytecode = previous
            service.load_models()
            _state["versions"] = {name: f"{name}@{_fingerprint(files)}" for name, files in ARTIFACTS.items()}
            _state["service"] = service
            _state["loaded"] = True
            _state["load_seconds"] = round(time.monotonic() - started, 2)
            logger.info("ML models loaded in %ss", _state["load_seconds"])
        except Exception as exc:  # missing files, version mismatch, import error
            _state["error"] = f"{type(exc).__name__}: {exc}"
            logger.exception("Could not load ML models; continuing with rule checks only")
    return _state["service"]


def warm_up():
    _load()


def status():
    return {
        "loaded": _state["loaded"],
        "error": _state["error"],
        "models": _state["versions"],
        "load_seconds": _state["load_seconds"],
    }


def reset_for_tests():
    _state.update(service=None, loaded=False, error=None, versions={}, load_seconds=None)


def _call(model, fn):
    service = _load()
    if service is None:
        return None
    try:
        return fn(service)
    except Exception:
        logger.exception("Prediction failed for %s", model)
        return None


def _result(model, label, flagged, note):
    return {
        "model": model,
        "version": _state["versions"].get(model, model),
        "label": label,
        "flagged": flagged,
        "validated_for_real_world_use": False,
        "note": note,
    }


def classify_sms(text):
    out = _call("sms_spam", lambda s: s.predict_sms(text))
    if out is None:
        return None
    flagged = out["prediction"] == "spam"
    return _result(
        "sms_spam", out["label"], flagged,
        "TF-IDF and Logistic Regression trained on a public SMS spam dataset. Spam is related to, but not the same as, fraud.",
    )


def classify_url(url):
    out = _call("phishing_url", lambda s: s.predict_phishing_url(url))
    if out is None:
        return None
    return _result(
        "phishing_url", out["label"], out["prediction"] == 0,
        out.get("warning") or "Experimental URL model. Feature calculations have not been validated against the training data.",
    )


def classify_job(text):
    record = {column: "Unknown" for column in JOB_CATEGORICAL}
    record.update(
        telecommuting=int("work from home" in text.lower() or "remote" in text.lower()),
        has_company_logo=0,
        has_questions=0,
        description_length=len(text),
        combined_text=text,
    )
    out = _call("fake_job", lambda s: s.predict_job_posting(record))
    if out is None:
        return None
    return _result(
        "fake_job", out["label"], out["prediction"] == 1,
        "Logistic Regression trained on structured job adverts. Pasted text lacks company metadata, so this model over-flags and is only used to support rule findings.",
    )
