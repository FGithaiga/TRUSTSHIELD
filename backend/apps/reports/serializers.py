import re

from rest_framework import serializers

from .models import CommunityReport

PHONE = re.compile(r"(?:\+?254|\b0)\s?(?:7|1)\d{2}\s?\d{3}\s?\d{3}\b")
EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")


def scrub(text):
    """Reports describe patterns, not people: personal contact details are removed before storage."""
    return EMAIL.sub("[email removed]", PHONE.sub("[number removed]", text))


class CommunityReportSerializer(serializers.ModelSerializer):
    # Kept private: hashed into community memory, never stored or shown as text.
    involved = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=300)

    class Meta:
        model = CommunityReport
        fields = ["id", "channel", "category", "summary", "region", "platform", "indicators", "status", "reported_at", "involved"]
        read_only_fields = ["id", "indicators", "status", "reported_at", "platform"]
        extra_kwargs = {"category": {"required": False, "allow_blank": True}, "region": {"required": False, "allow_blank": True}}

    def validate_summary(self, value):
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError("Describe the scam in at least 20 characters.")
        return scrub(value)

    def validate_category(self, value):
        return scrub(value.strip()) or "Unclassified"

    def validate_region(self, value):
        return value.strip() or "Not stated"
