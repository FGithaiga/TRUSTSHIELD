import csv

import pytest
from django.core.management import call_command

from apps.accounts.models import User
from apps.community.models import Indicator, Sighting
from apps.reports.models import CommunityReport
from apps.scans.analysis import rules
from apps.scans.models import Scan
from apps.trainer import views as trainer_views

pytestmark = pytest.mark.django_db

REVERSAL = "Confirmed. You have received Ksh 3,500.00 from JOHN. I sent it by mistake, please reverse it to 0712 000 111 urgently."
GENUINE = "TJK4ABCD12 Confirmed. Ksh250.00 paid to MAMA MBOGA SHOP. on 12/10/26 at 7:42 AM. New M-PESA balance is Ksh3,210.00. Transaction cost, Ksh0.00."


@pytest.fixture(autouse=True)
def _models_off(monkeypatch):
    monkeypatch.setattr("apps.scans.analysis.ml._load", lambda: None)
    trainer_views._analysis.cache_clear()


def make_client(email):
    from rest_framework.test import APIClient

    c = APIClient()
    c.force_authenticate(User.objects.create_user(email=email, password="Str0ng-Pass!", full_name=email.split("@")[0]))
    return c


def analyze(c, content, scan_type="mpesa"):
    r = c.post("/api/scans/analyze/", {"scan_type": scan_type, "content": content}, format="json")
    assert r.status_code == 201, r.data
    return r.data


class TestAnatomy:
    def test_genuine_layout_passes(self):
        anatomy, findings = rules.mpesa_anatomy(GENUINE)
        assert anatomy["passed"] == 3 and findings == []

    def test_fake_confirmation_fails(self):
        anatomy, findings = rules.mpesa_anatomy(REVERSAL)
        assert anatomy["passed"] == 0
        assert {"anatomy_no_code", "anatomy_amount_format", "anatomy_no_balance"} == {f["code"] for f in findings}

    def test_non_confirmation_is_skipped(self):
        assert rules.mpesa_anatomy("Reply with your PIN and the OTP code sent to you now.") == (None, [])

    def test_anatomy_in_api_result(self, auth_client):
        assert analyze(auth_client, GENUINE)["anatomy"]["passed"] == 3


class TestCommunityMemory:
    def test_other_users_sightings_are_reported(self):
        a, b = make_client("a@example.com"), make_client("b@example.com")
        first = analyze(a, REVERSAL)
        assert first["community_matches"] == []
        second = analyze(b, "Please send it back to 0712000111 now, sent by mistake")
        match = second["community_matches"][0]
        assert match == {"kind": "phone", "masked": "0712 XXX 111", "users": 1, "reports": 0}
        sighting = next(f for f in second["findings"] if f["source"] == "community")
        assert sighting["evidence"] == ["0712 XXX 111"] and sighting["severity"] == "medium"

    def test_own_history_does_not_count(self, auth_client):
        analyze(auth_client, REVERSAL)
        assert analyze(auth_client, REVERSAL)["community_matches"] == []

    def test_clear_results_are_not_recorded(self, auth_client):
        analyze(auth_client, "Hi, call me on 0712 000 111 when you arrive.")
        assert not Sighting.objects.exists()

    def test_raw_values_are_never_stored(self, auth_client):
        analyze(auth_client, REVERSAL)
        ind = Indicator.objects.get(kind="phone")
        assert "000" not in ind.masked.replace("XXX", "") or ind.masked == "0712 XXX 111"
        assert "0712000111" not in ind.value_hash and "254712000111" not in ind.value_hash

    def test_reports_count_only_once_public(self, auth_client):
        reporter = make_client("r@example.com")
        r = reporter.post("/api/reports/", {"channel": "url", "summary": "Fake rewards site asking for M-PESA PIN.", "involved": "http://evil-rewards.xyz/claim"}, format="json")
        assert r.status_code == 201 and "involved" not in r.data
        assert analyze(auth_client, "http://evil-rewards.xyz/login", "url")["community_matches"] == []
        CommunityReport.objects.filter(pk=r.data["id"]).update(status="verified")
        match = analyze(auth_client, "http://evil-rewards.xyz/login", "url")["community_matches"][0]
        assert match["reports"] == 1 and match["masked"] == "evil-rewards.xyz"

    def test_official_domains_never_become_indicators(self, auth_client):
        analyze(auth_client, "SAFARICOM: reply with your PIN or visit https://www.safaricom.co.ke now")
        assert not Indicator.objects.filter(kind="domain").exists()


class TestFeedback:
    def test_create_update_and_export(self, auth_client, user, tmp_path):
        scan = analyze(auth_client, REVERSAL)
        url = f"/api/scans/{scan['id']}/feedback/"
        assert auth_client.put(url, {"verdict": "agree", "actual": "scam"}, format="json").status_code == 200
        r = auth_client.put(url, {"verdict": "disagree", "actual": "legit", "comment": "It was my brother"}, format="json")
        assert r.data["verdict"] == "disagree"
        assert auth_client.get(f"/api/scans/{scan['id']}/").data["feedback"]["actual"] == "legit"

        out = tmp_path / "fb.csv"
        call_command("export_feedback", out=str(out))
        rows = list(csv.DictReader(out.open()))
        assert len(rows) == 1 and rows[0]["user_label"] == "legit" and rows[0]["content"] == ""

    def test_cannot_label_someone_elses_scan(self, auth_client):
        scan = analyze(auth_client, REVERSAL)
        other = make_client("o@example.com")
        assert other.put(f"/api/scans/{scan['id']}/feedback/", {"verdict": "agree"}, format="json").status_code == 404


class TestPulse:
    def test_small_groups_hidden(self, client):
        from django.core.cache import cache

        a, b = make_client("p1@example.com"), make_client("p2@example.com")
        for _ in range(3):
            analyze(a, REVERSAL)
        cache.clear()
        assert client.get("/api/pulse/").data["trending"] == []  # one person only
        analyze(b, REVERSAL)
        cache.clear()
        data = client.get("/api/pulse/").data
        assert data["trending"][0] == {"category": "Fake reversal request", "count": 4, "previous": 0}
        assert data["checks"] == 4 and data["high_share"] == 100


class TestTrainer:
    def test_round_hides_answers(self, auth_client):
        r = auth_client.get("/api/trainer/round/")
        assert len(r.data["challenges"]) == 5
        assert all(set(c) == {"id", "scan_type", "offer_type", "text"} for c in r.data["challenges"])

    def test_answer_reveals_pipeline_and_updates_stats(self, auth_client):
        r = auth_client.post("/api/trainer/answer/", {"challenge_id": "mp-pin", "answer": "scam"}, format="json")
        assert r.data["correct"] and r.data["analysis"]["risk_level"] == "high" and r.data["trustshield_agrees"]
        r = auth_client.post("/api/trainer/answer/", {"challenge_id": "url-kra", "answer": "scam"}, format="json")
        assert not r.data["correct"] and r.data["answer"] == "safe"
        stats = auth_client.get("/api/trainer/stats/").data
        assert stats == {**stats, "answered": 2, "correct": 1, "accuracy": 50, "streak_days": 1, "level": "Learner", "played_today": True}
        assert not Scan.objects.exists()  # practice never appears in scan history

    def test_invalid_challenge(self, auth_client):
        assert auth_client.post("/api/trainer/answer/", {"challenge_id": "nope", "answer": "scam"}, format="json").status_code == 400
