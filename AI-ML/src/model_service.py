
"""Prediction service for TrustShield's saved experimental ML models."""

from pathlib import Path

import joblib

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

_phishing_model = None
_phishing_vectorizer = None
_phishing_threshold = None

_jobs_model = None
_jobs_vectorizer = None
_jobs_threshold = None

_sms_model = None
_sms_vectorizer = None
_sms_threshold = None


def load_models():
    """Load all saved models, vectorizers, and thresholds once."""
    global _phishing_model, _phishing_vectorizer, _phishing_threshold
    global _jobs_model, _jobs_vectorizer, _jobs_threshold
    global _sms_model, _sms_vectorizer, _sms_threshold

    if _phishing_model is None:
        _phishing_model = joblib.load(
            MODELS_DIR / "phishing_candidate_model.joblib"
        )
        _phishing_vectorizer = joblib.load(
            MODELS_DIR / "phishing_candidate_vectorizer.joblib"
        )
        _phishing_threshold = float(
            joblib.load(MODELS_DIR / "phishing_candidate_threshold.joblib")
        )

    if _jobs_model is None:
        _jobs_model = joblib.load(
            MODELS_DIR / "fake_job_logistic_regression.joblib"
        )
        _jobs_vectorizer = joblib.load(
            MODELS_DIR / "fake_job_tfidf.joblib"
        )
        _jobs_threshold = float(
            joblib.load(MODELS_DIR / "fake_job_threshold.joblib")
        )

    if _sms_model is None:
        _sms_model = joblib.load(
            MODELS_DIR / "sms_logistic_regression.joblib"
        )
        _sms_vectorizer = joblib.load(
            MODELS_DIR / "sms_tfidf.joblib"
        )
        _sms_threshold = float(
            joblib.load(MODELS_DIR / "sms_threshold.joblib")
        )


def _positive_class_probability(model, vectorizer, text, positive_class):
    """Return probability for a specified class, regardless of class order."""
    transformed = vectorizer.transform([text])
    probabilities = model.predict_proba(transformed)[0]
    class_index = list(model.classes_).index(positive_class)
    return float(probabilities[class_index])


def predict_phishing_url(url: str) -> dict:
    """Assess whether a URL resembles phishing or legitimate URLs."""
    if not isinstance(url, str) or not url.strip():
        raise ValueError("Please enter a URL.")

    load_models()
    url = url.strip()

    # Training labels: 0 = phishing, 1 = legitimate.
    phishing_probability = _positive_class_probability(
        _phishing_model,
        _phishing_vectorizer,
        url,
        0,
    )
    prediction = 0 if phishing_probability >= _phishing_threshold else 1

    return {
        "prediction": prediction,
        "label": (
            "Phishing URL" if prediction == 0 else "Legitimate URL"
        ),
        "phishing_probability": round(phishing_probability, 4),
        "threshold": _phishing_threshold,
        "validated_for_real_world_use": False,
        "warning": (
            "Experimental URL text model only. This result is not proof "
            "that a URL is safe or malicious; verify suspicious links independently."
        ),
    }


def predict_sms(message: str) -> dict:
    """Classify an SMS message as ham or spam."""
    if not isinstance(message, str) or not message.strip():
        raise ValueError("Please enter a message.")

    load_models()
    message = message.strip()

    # Training labels: 1 = spam, 0 = ham.
    spam_probability = _positive_class_probability(
        _sms_model,
        _sms_vectorizer,
        message,
        1,
    )
    prediction = (
        "spam" if spam_probability >= _sms_threshold else "ham"
    )

    return {
        "prediction": prediction,
        "label": prediction.upper(),
        "spam_probability": round(spam_probability, 4),
        "threshold": _sms_threshold,
        "validated_for_real_world_use": False,
    }


def predict_job_posting(job_posting) -> dict:
    """Classify job-advert text using the trained TF-IDF model."""
    if isinstance(job_posting, dict):
        text = job_posting.get("combined_text", "")
    elif isinstance(job_posting, str):
        text = job_posting
    else:
        raise ValueError("Job posting must be text or a dictionary.")

    if not isinstance(text, str) or not text.strip():
        raise ValueError("Please enter job-advert text.")

    load_models()

    # Training labels: 1 = fraudulent, 0 = legitimate.
    fraud_probability = _positive_class_probability(
        _jobs_model,
        _jobs_vectorizer,
        text.strip(),
        1,
    )
    prediction = 1 if fraud_probability >= _jobs_threshold else 0

    return {
        "prediction": prediction,
        "label": (
            "Fraudulent job posting"
            if prediction == 1
            else "Likely legitimate job posting"
        ),
        "fraud_probability": round(fraud_probability, 4),
        "threshold": _jobs_threshold,
        "validated_for_real_world_use": False,
    }
