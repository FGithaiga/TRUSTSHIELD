import re

from django.utils import timezone
from rest_framework import serializers

from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = [
            "id", "reference", "incident_type", "occurred_at", "amount", "channel", "transaction_code",
            "suspect_contact", "description", "consent", "status", "created_at",
        ]
        read_only_fields = ["id", "reference", "status", "created_at"]
        extra_kwargs = {"incident_type": {"error_messages": {"invalid_choice": "Choose what happened.", "required": "Choose what happened."}}}

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Describe what happened in at least 20 characters.")
        return value.strip()

    def validate_occurred_at(self, value):
        if value and value > timezone.now():
            raise serializers.ValidationError("The date cannot be in the future.")
        return value

    def validate_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Enter an amount of zero or more.")
        return value

    def validate_transaction_code(self, value):
        value = value.strip().upper()
        if value and not re.fullmatch(r"[A-Z0-9]{8,12}", value):
            raise serializers.ValidationError("M-PESA codes are 8 to 12 letters and numbers.")
        return value

    def validate_consent(self, value):
        if value is not True:
            raise serializers.ValidationError("Confirm that you agree to store this summary.")
        return value
