from django.conf import settings
from django.db import models


class CommunityReport(models.Model):
    class Channel(models.TextChoices):
        MPESA = "mpesa", "SMS message"
        URL = "url", "Link"
        OFFER = "offer", "Offer"

    class Status(models.TextChoices):
        SYNTHETIC = "synthetic", "Demo example"
        PENDING = "pending", "Awaiting review"
        VERIFIED = "verified", "Reviewed"
        REJECTED = "rejected", "Rejected"

    channel = models.CharField(max_length=10, choices=Channel.choices)
    category = models.CharField(max_length=80, default="Unclassified")
    summary = models.TextField(max_length=600)
    region = models.CharField(max_length=60, default="Not stated")
    platform = models.CharField(max_length=40, blank=True)
    indicators = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reports")
    source_ref = models.CharField(max_length=20, blank=True, help_text="Identifier in the source dataset, if imported.")
    reported_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-reported_at"]

    def __str__(self):
        return f"{self.category} ({self.status})"
