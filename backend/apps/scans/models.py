import uuid

from django.conf import settings
from django.db import models


class Scan(models.Model):
    class ScanType(models.TextChoices):
        MPESA = "mpesa", "M-PESA message"
        URL = "url", "Link"
        OFFER = "offer", "Offer"

    class RiskLevel(models.TextChoices):
        HIGH = "high", "High risk"
        CAUTION = "caution", "Caution"
        CLEAR = "clear", "No obvious warning detected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scans")
    scan_type = models.CharField(max_length=10, choices=ScanType.choices)
    offer_type = models.CharField(max_length=20, blank=True, null=True)
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, db_index=True)
    risk_score = models.PositiveSmallIntegerField()
    scam_category = models.CharField(max_length=80)
    summary = models.CharField(max_length=200)
    findings = models.JSONField(default=list)
    url_details = models.JSONField(null=True, blank=True)
    model_result = models.JSONField(null=True, blank=True)
    explanation = models.TextField()
    explanation_source = models.CharField(max_length=10, default="template")
    recommended_actions = models.JSONField(default=list)
    limitations = models.JSONField(default=list)
    model_version = models.CharField(max_length=80)
    preview = models.CharField(max_length=120)
    anatomy = models.JSONField(null=True, blank=True)
    community_matches = models.JSONField(default=list, blank=True)
    # Raw text is stored only when the user opts in (preferences.save_scan_text).
    content = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.get_scan_type_display()} - {self.risk_level} ({self.created_at:%Y-%m-%d})"


class ScanFeedback(models.Model):
    """The user's judgement on a result. Exported as labelled data for the ML workstream."""

    class Verdict(models.TextChoices):
        AGREE = "agree", "The assessment was right"
        DISAGREE = "disagree", "The assessment was wrong"

    class Actual(models.TextChoices):
        SCAM = "scam", "It was a scam"
        LEGIT = "legit", "It was genuine"
        UNSURE = "unsure", "Not sure"

    scan = models.OneToOneField(Scan, on_delete=models.CASCADE, related_name="feedback")
    verdict = models.CharField(max_length=10, choices=Verdict.choices)
    actual = models.CharField(max_length=10, choices=Actual.choices, default=Actual.UNSURE)
    comment = models.CharField(max_length=300, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.scan_id}: {self.verdict}/{self.actual}"
