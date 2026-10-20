
from pathlib import Path

import joblib
import pandas as pd

try:
    from .url_features import extract_url_features
except ImportError:
    from url_features import extract_url_features


# Resolve the models directory relative to this file.
MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

_phishing_model = None
_jobs_model = None
_jobs_preprocessor = None
_sms_model = None
_sms_vectorizer = None


def load_models():
    """Load saved models once and reuse them."""
    global _phishing_model, _jobs_model, _jobs_preprocessor
    global _sms_model, _sms_vectorizer

    if _phishing_model is None:
        _phishing_model = joblib.load(
            MODELS_DIR / "phishing_model.pkl"
        )

    if _jobs_model is None:
        _jobs_model = joblib.load(
            MODELS_DIR / "fake_job_model.pkl"
        )

    if _jobs_preprocessor is None:
        _jobs_preprocessor = joblib.load(
            MODELS_DIR / "fake_job_preprocessor.pkl"
        )

    if _sms_model is None:
        _sms_model = joblib.load(
            MODELS_DIR / "sms_spam_model.pkl"
        )

    if _sms_vectorizer is None:
        _sms_vectorizer = joblib.load(
            MODELS_DIR / "sms_vectorizer.pkl"
        )


def predict_phishing_url(url: str) -> dict:
    """Predict whether a URL resembles phishing or legitimate URLs.

    URL feature calculations are approximate and have not been
    validated against the original training feature definitions.
    Do not use this experimental result as a definitive security verdict.
    """
    load_models()

    feature_values = extract_url_features(url)
    feature_frame = pd.DataFrame([feature_values])

    prediction = int(_phishing_model.predict(feature_frame)[0])

    return {
        "prediction": prediction,
        "label": (
            "Phishing URL"
            if prediction == 0
            else "Legitimate URL"
        ),
        "validated_for_real_world_use": False,
        "warning": (
            "Experimental result only. URL feature calculations "
            "have not been validated against the original dataset."
        ),
    }


def predict_sms(message: str) -> dict:
    """Classify an SMS message as ham or spam."""
    if not isinstance(message, str) or not message.strip():
        raise ValueError("Please enter a message.")

    load_models()

    transformed_message = _sms_vectorizer.transform(
        [message.strip()]
    )

    prediction = _sms_model.predict(transformed_message)[0]

    return {
        "prediction": str(prediction),
        "label": str(prediction).upper(),
    }


def predict_job_posting(job_posting: dict) -> dict:
    """Classify a job posting using the saved training preprocessor."""
    if not isinstance(job_posting, dict):
        raise ValueError(
            "Job posting must be provided as a dictionary."
        )

    load_models()

    # Create a DataFrame from the submitted job posting.
    input_row = pd.DataFrame([job_posting])

    # Match the exact feature columns and order used during training.
    expected_columns = list(
        _jobs_preprocessor.feature_names_in_
    )
    input_row = input_row.reindex(columns=expected_columns)

    # Identify columns processed by a text vectorizer.
    text_columns = set()

    for transformer_name, transformer, columns in (
        _jobs_preprocessor.transformers_
    ):
        if transformer_name == "remainder":
            continue

        if transformer == "drop" or transformer == "passthrough":
            continue

        if isinstance(columns, str):
            columns = [columns]

        # A transformer may itself be a text vectorizer.
        if hasattr(transformer, "build_analyzer"):
            text_columns.update(columns)

        # Or it may be a pipeline containing a text vectorizer.
        elif hasattr(transformer, "steps"):
            for _, step in transformer.steps:
                if hasattr(step, "build_analyzer"):
                    text_columns.update(columns)
                    break

    # Fill missing text values with empty strings.
    for column in text_columns:
        input_row[column] = (
            input_row[column]
            .fillna("")
            .astype(str)
        )

    # Fill any remaining missing values safely.
    for column in input_row.columns:
        if input_row[column].isna().any():
            if column in text_columns:
                input_row[column] = input_row[column].fillna("")
            else:
                input_row[column] = input_row[column].fillna(0)

    # Apply the original fitted preprocessor and classifier.
    transformed = _jobs_preprocessor.transform(input_row)

    prediction = int(
        _jobs_model.predict(transformed)[0]
    )

    return {
        "prediction": prediction,
        "label": (
            "Fraudulent job posting"
            if prediction == 1
            else "Likely legitimate job posting"
        ),
        "validated_for_real_world_use": False,
    }
