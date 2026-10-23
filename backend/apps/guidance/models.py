from django.db import models


class ReportingResource(models.Model):
    """An official channel users can contact. Editable in the admin so contacts can be kept current."""

    class Kind(models.TextChoices):
        REPORT = "Report"
        SUPPORT = "Support"
        EMERGENCY = "Emergency"

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    contact = models.CharField(max_length=120)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    description = models.CharField(max_length=255)
    url = models.URLField(blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    reviewed_on = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name
