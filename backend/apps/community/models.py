from django.conf import settings
from django.db import models


class Indicator(models.Model):
    """A phone number or domain, stored only as a keyed hash plus a masked label."""

    class Kind(models.TextChoices):
        PHONE = "phone", "Phone number"
        DOMAIN = "domain", "Domain"

    kind = models.CharField(max_length=10, choices=Kind.choices)
    value_hash = models.CharField(max_length=64)
    masked = models.CharField(max_length=80, help_text="Display form; phones are partially hidden.")
    first_seen = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["kind", "value_hash"], name="unique_indicator")]

    def __str__(self):
        return f"{self.get_kind_display()}: {self.masked}"


class Sighting(models.Model):
    """One user flagged this indicator in a high-risk or caution check. One row per user."""

    indicator = models.ForeignKey(Indicator, on_delete=models.CASCADE, related_name="sightings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sightings")
    last_seen = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["indicator", "user"], name="unique_sighting_per_user")]


class ReportIndicator(models.Model):
    """Links a community report to an indicator it mentions. Counts only once the report is public."""

    report = models.ForeignKey("reports.CommunityReport", on_delete=models.CASCADE, related_name="indicator_links")
    indicator = models.ForeignKey(Indicator, on_delete=models.CASCADE, related_name="report_links")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["report", "indicator"], name="unique_report_indicator")]
