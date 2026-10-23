import pytest

from apps.reports.models import CommunityReport
from apps.scans.models import Scan

pytestmark = pytest.mark.django_db

REVERSAL = "Confirmed. You have received Ksh 3,500. I sent it by mistake, please reverse it to 0712 000 111 urgently."


@pytest.fixture(autouse=True)
def _models_off(monkeypatch):
    # API tests exercise the contract; real-model behaviour is covered in test_ml.py.
    monkeypatch.setattr("apps.scans.analysis.ml._load", lambda: None)


class TestAuth:
    def test_register_login_me_logout(self, client):
        r = client.post("/api/auth/register/", {"full_name": "Otieno", "email": "O@Example.com", "password": "Str0ng-Pass!"}, format="json")
        assert r.status_code == 201 and r.data["user"]["email"] == "o@example.com"
        assert r.data["user"]["preferences"]["save_scan_text"] is False

        r = client.post("/api/auth/login/", {"identifier": "o@example.com", "password": "Str0ng-Pass!"}, format="json")
        token = r.data["token"]
        client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        assert client.get("/api/auth/me/").data["full_name"] == "Otieno"
        assert client.post("/api/auth/logout/").status_code == 204
        assert client.get("/api/auth/me/").status_code == 401

    def test_login_with_phone(self, client, user):
        r = client.post("/api/auth/login/", {"identifier": "0712 345 678", "password": "Str0ng-Pass!"}, format="json")
        assert r.status_code == 200

    def test_bad_login_is_generic(self, client, user):
        r = client.post("/api/auth/login/", {"identifier": user.email, "password": "wrong"}, format="json")
        assert r.status_code == 400 and r.data["non_field_errors"] == ["Incorrect email, phone number or password."]

    def test_register_field_errors(self, client, user):
        r = client.post("/api/auth/register/", {"full_name": " ", "email": user.email, "password": "123", "phone": "123"}, format="json")
        assert r.status_code == 400 and {"full_name", "email", "phone"} <= set(r.data)

    def test_weak_password_rejected(self, client):
        r = client.post("/api/auth/register/", {"full_name": "A", "email": "a@b.co", "password": "password"}, format="json")
        assert r.status_code == 400 and "password" in r.data

    def test_update_preferences_merges(self, auth_client):
        r = auth_client.patch("/api/auth/me/", {"preferences": {"save_scan_text": True}}, format="json")
        assert r.data["preferences"] == {"save_scan_text": True, "weekly_summary": True}
        assert auth_client.patch("/api/auth/me/", {"preferences": {"evil": True}}, format="json").status_code == 400


class TestScans:
    def test_requires_auth(self, client):
        assert client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": "x"}, format="json").status_code == 401

    def test_analyze_contract(self, auth_client):
        r = auth_client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": REVERSAL}, format="json")
        assert r.status_code == 201
        for key in ["id", "risk_level", "risk_score", "scam_category", "findings", "explanation", "recommended_actions", "limitations", "model_version", "preview"]:
            assert key in r.data
        assert r.data["risk_level"] == "high" and r.data["scam_category"] == "Fake reversal request"

    def test_raw_text_not_stored_by_default_and_evidence_redacted(self, auth_client):
        r = auth_client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": REVERSAL}, format="json")
        phone = next(f for f in r.data["findings"] if f["code"] == "phone_number")
        assert phone["evidence"] == ["0712 000 111"]  # full evidence in the immediate response
        scan = Scan.objects.get(pk=r.data["id"])
        assert scan.content is None
        stored = next(f for f in scan.findings if f["code"] == "phone_number")
        assert stored["evidence"] == ["0712 XXX 111"]

    def test_raw_text_stored_when_opted_in(self, auth_client, user):
        user.preferences = {**user.preferences, "save_scan_text": True}
        user.save()
        r = auth_client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": REVERSAL}, format="json")
        assert Scan.objects.get(pk=r.data["id"]).content == REVERSAL

    def test_url_validation_error_shape(self, auth_client):
        r = auth_client.post("/api/scans/analyze/", {"scan_type": "url", "content": "not a link"}, format="json")
        assert r.status_code == 400 and "content" in r.data

    @pytest.mark.parametrize("payload, field", [
        ({"scan_type": "email", "content": "x"}, "scan_type"),
        ({"scan_type": "mpesa", "content": ""}, "content"),
        ({"scan_type": "mpesa", "content": "x" * 5001}, "content"),
        ({"scan_type": "offer", "content": "x", "offer_type": "car"}, "offer_type"),
    ])
    def test_bad_requests(self, auth_client, payload, field):
        r = auth_client.post("/api/scans/analyze/", payload, format="json")
        assert r.status_code == 400 and field in r.data

    def test_history_filters_and_isolation(self, auth_client, client):
        auth_client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": REVERSAL}, format="json")
        auth_client.post("/api/scans/analyze/", {"scan_type": "url", "content": "https://www.safaricom.co.ke"}, format="json")
        assert auth_client.get("/api/scans/").data["count"] == 2
        assert auth_client.get("/api/scans/?risk_level=high").data["count"] == 1
        assert auth_client.get("/api/scans/?scan_type=url&search=safaricom").data["count"] == 1

        from apps.accounts.models import User
        other = User.objects.create_user(email="x@y.co", password="Str0ng-Pass!", full_name="X")
        client.force_authenticate(other)
        scan_id = Scan.objects.first().pk
        assert client.get("/api/scans/").data["count"] == 0
        assert client.get(f"/api/scans/{scan_id}/").status_code == 404
        assert client.delete(f"/api/scans/{scan_id}/").status_code == 404

    def test_delete(self, auth_client):
        r = auth_client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": REVERSAL}, format="json")
        assert auth_client.delete(f"/api/scans/{r.data['id']}/").status_code == 204
        assert not Scan.objects.exists()

    def test_dashboard_summary(self, auth_client):
        auth_client.post("/api/scans/analyze/", {"scan_type": "mpesa", "content": REVERSAL}, format="json")
        r = auth_client.get("/api/dashboard/summary/?days=7")
        assert r.data["days"] == 7 and len(r.data["by_day"]) == 7
        assert r.data["totals"] == {"scans": 1, "high": 1, "caution": 0, "clear": 0}
        assert r.data["by_day"][-1]["high"] == 1
        assert r.data["top_categories"] == [{"category": "Fake reversal request", "count": 1}]
        assert len(r.data["recent"]) == 1


class TestIncidents:
    def test_create_and_list(self, auth_client):
        payload = {"incident_type": "sent_money", "description": "I sent Ksh 2,000 after a fake reversal call.", "consent": True,
                   "amount": "2000", "transaction_code": "tjk4abcd12"}
        r = auth_client.post("/api/incidents/", payload, format="json")
        assert r.status_code == 201 and r.data["reference"].startswith("TS-") and r.data["transaction_code"] == "TJK4ABCD12"
        assert len(auth_client.get("/api/incidents/").data["results"]) == 1

    def test_validation(self, auth_client):
        r = auth_client.post("/api/incidents/", {"description": "short", "consent": False, "occurred_at": "2999-01-01T00:00:00Z"}, format="json")
        assert r.status_code == 400 and {"incident_type", "description", "consent", "occurred_at"} <= set(r.data)


class TestReportsAndGuidance:
    def test_public_feed_hides_pending_from_others(self, client, auth_client, user):
        CommunityReport.objects.create(channel="mpesa", summary="Synthetic example of a reversal scam.", status="synthetic")
        r = auth_client.post("/api/reports/", {"channel": "url", "summary": "Fake loan SMS, call 0712 000 111 or mail a@b.com to apply"}, format="json")
        assert r.status_code == 201 and r.data["status"] == "pending"
        assert "[number removed]" in r.data["summary"] and "[email removed]" in r.data["summary"]
        assert client.get("/api/reports/").data["count"] == 1
        assert auth_client.get("/api/reports/").data["count"] == 2
        assert client.get("/api/reports/?channel=url").data["count"] == 0

    def test_anonymous_cannot_post(self, client):
        assert client.post("/api/reports/", {"summary": "x" * 30}, format="json").status_code == 401

    def test_guidance_is_seeded(self, client):
        r = client.get("/api/guidance/")
        assert r.status_code == 200 and len(r.data["resources"]) == 5 and r.data["verified_on"]

    def test_health(self, client):
        r = client.get("/api/health/")
        assert r.status_code == 200 and r.data["mode"] == "live" and r.data["database"] == "ok"


class TestAuthHardening:
    def test_unknown_account_still_hashes(self, client, monkeypatch):
        calls = []
        from django.contrib.auth import base_user

        real = base_user.make_password
        monkeypatch.setattr(base_user, "make_password", lambda *a, **k: calls.append(1) or real(*a, **k))
        client.post("/api/auth/login/", {"identifier": "nobody@example.com", "password": "x"}, format="json")
        assert calls, "login for an unknown account must still run the password hasher"

    def test_new_passwords_use_argon2(self, client, settings):
        settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.Argon2PasswordHasher"]
        client.post("/api/auth/register/", {"full_name": "A", "email": "argon@example.com", "password": "Str0ng-Pass!"}, format="json")
        from apps.accounts.models import User

        assert User.objects.get(email="argon@example.com").password.startswith("argon2")


def test_unknown_api_route_returns_json(client):
    r = client.get("/api/does-not-exist/")
    assert r.status_code == 404 and r.json() == {"detail": "Not found."}


class TestPasswordFlows:
    def test_reset_request_is_uniform_and_sends_link(self, client, user, mailoutbox):
        a = client.post("/api/auth/password-reset/", {"email": user.email}, format="json")
        b = client.post("/api/auth/password-reset/", {"email": "nobody@example.com"}, format="json")
        assert a.status_code == b.status_code == 200 and a.data == b.data
        assert len(mailoutbox) == 1 and "/reset-password?uid=" in mailoutbox[0].body

    def test_reset_confirm_changes_password_and_revokes_tokens(self, client, user, mailoutbox):
        import re

        from rest_framework.authtoken.models import Token

        Token.objects.create(user=user)
        client.post("/api/auth/password-reset/", {"email": user.email}, format="json")
        uid, token = re.search(r"uid=([^&]+)&token=(\S+)", mailoutbox[0].body).groups()
        assert client.post("/api/auth/password-reset/confirm/", {"uid": uid, "token": token, "password": "123"}, format="json").status_code == 400
        r = client.post("/api/auth/password-reset/confirm/", {"uid": uid, "token": token, "password": "N3w-Safe-Pass!"}, format="json")
        assert r.status_code == 200 and not Token.objects.filter(user=user).exists()
        assert client.post("/api/auth/password-reset/confirm/", {"uid": uid, "token": token, "password": "N3w-Safe-Pass!"}, format="json").status_code == 400
        assert client.post("/api/auth/login/", {"identifier": user.email, "password": "N3w-Safe-Pass!"}, format="json").status_code == 200

    def test_change_password(self, auth_client, user):
        bad = auth_client.post("/api/auth/change-password/", {"current_password": "wrong", "new_password": "N3w-Safe-Pass!"}, format="json")
        assert bad.status_code == 400 and "current_password" in bad.data
        ok = auth_client.post("/api/auth/change-password/", {"current_password": "Str0ng-Pass!", "new_password": "N3w-Safe-Pass!"}, format="json")
        assert ok.status_code == 200 and ok.data["token"]
        user.refresh_from_db()
        assert user.check_password("N3w-Safe-Pass!")


def test_weekly_summary_command(user, mailoutbox):
    from django.core.management import call_command

    call_command("send_weekly_summaries")
    assert len(mailoutbox) == 1 and "weekly" in mailoutbox[0].subject.lower()
