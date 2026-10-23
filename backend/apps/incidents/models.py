from django.conf import settings
from django.db import models


class Incident(models.Model):
    class Type(models.TextChoices):
        SENT_MONEY = "sent_money", "I sent money to a scammer"
        SHARED_PIN = "shared_pin", "I shared my PIN or OTP"
        CLICKED_LINK = "clicked_link", "I opened a suspicious link"
        JOB_FEE = "job_fee", "I paid a job or training fee"
        SHOPPING = "shopping", "I paid for goods never delivered"
        OTHER = "other", "Something else"

    class Channel(models.TextChoices):
        MPESA = "mpesa", "M-PESA send money"
        TILL = "till", "Till or paybill"
        BANK = "bank", "Bank transfer"
        CARD = "card", "Card"
        NONE = "none", "No payment made"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="incidents")
    reference = models.CharField(max_length=20, unique=True, blank=True)
    incident_type = models.CharField(max_length=20, choices=Type.choices)
    occurred_at = models.DateTimeField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.MPESA)
    transaction_code = models.CharField(max_length=20, blank=True)
    suspect_contact = models.CharField(max_length=200, blank=True)
    description = models.TextField(max_length=2000)
    consent = models.BooleanField(default=False)
    status = models.CharField(max_length=10, default="draft")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            self.reference = f"TS-{self.created_at:%Y}-{1040 + self.pk:05d}"
            super().save(update_fields=["reference"])

    def __str__(self):
        return self.reference
