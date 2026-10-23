import pytest

from apps.scans import privacy
from apps.scans.analysis import engine, explainer, rules, url_analyzer


def codes(findings):
    return {f["code"] for f in findings}


class TestRules:
    def test_pin_request_is_flagged_with_evidence(self):
        found = rules.run(rules.MPESA_RULES, "Reply with your M-PESA PIN now")
        pin = next(f for f in found if f["code"] == "pin_request")
        assert pin["severity"] == "high" and pin["evidence"] == ["PIN"]

    def test_ordinary_message_has_no_findings(self):
        assert rules.run(rules.MPESA_RULES, "Hi, I have just paid for the books. Thanks!") == []

    def test_send_to_join_counts_as_upfront_fee(self):
        assert "upfront_fee" in codes(rules.run(rules.OFFER_RULES, "Send to the agent number to join."))

    def test_first_link_strips_trailing_punctuation(self):
        assert rules.first_link("Visit http://bad.xyz/claim.") == "http://bad.xyz/claim"


class TestUrlAnalyzer:
    def test_official_domain_is_clean(self):
        findings, details = url_analyzer.analyze("https://www.safaricom.co.ke/personal/m-pesa")
        assert findings == [] and details["is_official_domain"] and details["registered_domain"] == "safaricom.co.ke"

    def test_brand_lookalike(self):
        findings, details = url_analyzer.analyze("http://safaricom-rewards-update.com/claim/now")
        assert {"brand_impersonation", "no_https", "lure_words"} <= codes(findings)
        assert details["impersonated_brand"] == "safaricom" and not details["is_official_domain"]

    def test_short_brand_needs_whole_label(self):
        _, details = url_analyzer.analyze("https://ukraine-news.com")
        assert details["impersonated_brand"] is None
        _, details = url_analyzer.analyze("https://kra-refund.com")
        assert details["impersonated_brand"] == "kra"

    def test_ip_host(self):
        findings, _ = url_analyzer.analyze("http://197.0.0.12/verify")
        assert "ip_host" in codes(findings)

    def test_government_suffix_is_official(self):
        _, details = url_analyzer.analyze("https://www.dci.go.ke")
        assert details["is_official_domain"]

    @pytest.mark.parametrize("raw", ["", "not a url", "ftp://files.example.com", "javascript:alert(1)", "localhost"])
    def test_invalid_input(self, raw):
        with pytest.raises(url_analyzer.InvalidURL):
            url_analyzer.analyze(raw)


class TestEngineWithoutModels:
    @pytest.fixture(autouse=True)
    def _models_off(self, monkeypatch):
        monkeypatch.setattr("apps.scans.analysis.ml._load", lambda: None)

    def test_rules_still_work_and_limitation_is_reported(self):
        r = engine.analyze("mpesa", "Please reverse the money I sent by mistake urgently, send your PIN")
        assert r["risk_level"] == "high" and r["model_result"] is None
        assert any("unavailable" in l for l in r["limitations"])

    def test_clear_result(self):
        r = engine.analyze("mpesa", "See you at school at 9 AM.")
        assert r["risk_level"] == "clear" and r["scam_category"] == engine.NO_CATEGORY

    def test_findings_sorted_by_severity(self):
        r = engine.analyze("mpesa", "Confirmed. You have received Ksh 500. I sent it by mistake, reverse it urgently to 0712 000 111")
        order = [engine.SEVERITY_ORDER[f["severity"]] for f in r["findings"]]
        assert order == sorted(order)

    def test_empty_content_rejected(self):
        with pytest.raises(engine.AnalysisError):
            engine.analyze("offer", "   ")


class TestPrivacy:
    def test_phone_numbers_masked(self):
        assert privacy.mask("call 0712 000 111 now") == "call 0712 XXX 111 now"

    def test_long_evidence_truncated(self):
        assert len(privacy.mask("x" * 200)) == privacy.MAX_EVIDENCE_CHARS

    def test_redaction_does_not_mutate_input(self):
        original = [{"code": "a", "evidence": ["0712 000 111"]}]
        privacy.redact_findings(original)
        assert original[0]["evidence"] == ["0712 000 111"]


class TestExplainer:
    def test_template_without_llm(self, settings):
        settings.LLM_API_BASE = ""
        text, source = explainer.explain("url", "high", "x", [{"title": "Uses a raw IP", "severity": "high", "evidence": []}])
        assert source == "template" and "1 warning sign" in text

    def test_llm_output_with_new_link_is_rejected(self, settings, monkeypatch):
        settings.LLM_API_BASE = "http://llm.invalid/v1"
        monkeypatch.setattr(explainer, "_ask_llm", lambda *a: "This is fake, visit http://other.example to check it out right now please.")
        _, source = explainer.explain("mpesa", "high", "x", [{"title": "t", "severity": "high", "evidence": ["by mistake"]}])
        assert source == "template"

    def test_llm_failure_falls_back(self, settings, monkeypatch):
        settings.LLM_API_BASE = "http://llm.invalid/v1"

        def boom(*a):
            raise TimeoutError

        monkeypatch.setattr(explainer, "_ask_llm", boom)
        _, source = explainer.explain("mpesa", "high", "x", [{"title": "t", "severity": "high", "evidence": []}])
        assert source == "template"
