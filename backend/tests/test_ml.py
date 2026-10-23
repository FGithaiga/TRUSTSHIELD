"""Integration with the real AI-ML artifacts. Skipped if the models are not present."""
import pytest
from django.conf import settings

from apps.scans.analysis import engine, ml

pytestmark = pytest.mark.skipif(not (settings.ML_MODELS_DIR / "sms_spam_model.pkl").exists(), reason="ML artifacts not available")


@pytest.fixture(scope="module", autouse=True)
def _load_models():
    ml.reset_for_tests()
    ml.warm_up()
    assert ml.status()["loaded"], ml.status()["error"]


def test_versions_are_fingerprinted():
    versions = ml.status()["models"]
    assert set(versions) == {"sms_spam", "fake_job", "phishing_url"}
    assert all("@" in v for v in versions.values())


def test_sms_model_contributes_to_scam():
    r = engine.analyze("mpesa", "CONGRATULATIONS! You have won Ksh 50,000. Pay a processing fee of Ksh 1,200 to claim.")
    assert r["model_result"]["label"] == "SPAM" and "model_sms_spam" in {f["code"] for f in r["findings"]}
    assert r["model_version"].startswith("rules@") and "sms_spam@" in r["model_version"]


def test_sms_model_ham():
    r = engine.analyze("mpesa", "Hi Wanjiru, I have just paid the Ksh 1,500 for the books. Thanks!")
    assert r["model_result"]["label"] == "HAM" and r["risk_level"] == "clear"


def test_phishing_model_not_counted_for_official_domain():
    r = engine.analyze("url", "https://www.safaricom.co.ke/personal/m-pesa")
    assert r["risk_level"] == "clear" and r["model_result"] is not None


def test_fake_job_model_runs_on_pasted_text():
    # model_service.predict_job_posting fails on missing categorical fields; the adapter must supply them.
    result = ml.classify_job("We are hiring an accountant in Nairobi. Apply on our careers page.")
    assert result is not None and result["model"] == "fake_job"


def test_fake_job_model_needs_rule_support():
    r = engine.analyze("offer", "We are hiring an Accounts Assistant at our Nairobi office. Shortlisted candidates will be invited for an interview.", "job")
    assert r["risk_level"] == "clear"
