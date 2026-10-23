from django.conf import settings
from rest_framework import serializers

from .analysis.engine import OFFER_TYPES, SCAN_TYPES
from .models import Scan, ScanFeedback


class AnalyzeRequestSerializer(serializers.Serializer):
    scan_type = serializers.ChoiceField(choices=SCAN_TYPES, error_messages={"invalid_choice": "Choose mpesa, url or offer."})
    content = serializers.CharField(
        max_length=settings.SCAN_MAX_CONTENT_LENGTH,
        allow_blank=True,
        trim_whitespace=True,
        error_messages={"max_length": "Keep the text under 5,000 characters."},
    )
    offer_type = serializers.ChoiceField(choices=OFFER_TYPES, required=False, allow_null=True)


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanFeedback
        fields = ["verdict", "actual", "comment", "updated_at"]
        read_only_fields = ["updated_at"]


class ScanSerializer(serializers.ModelSerializer):
    risk_score_is_heuristic = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = Scan
        fields = [
            "id", "scan_type", "offer_type", "created_at", "risk_level", "risk_score", "risk_score_is_heuristic",
            "scam_category", "summary", "findings", "url_details", "model_result", "explanation",
            "explanation_source", "recommended_actions", "limitations", "model_version", "preview", "content",
            "anatomy", "community_matches", "feedback",
        ]
        read_only_fields = fields

    def get_risk_score_is_heuristic(self, obj):
        return True

    def get_feedback(self, obj):
        fb = getattr(obj, "feedback", None) if hasattr(obj, "feedback") else None
        return FeedbackSerializer(fb).data if fb else None


class ScanListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = ["id", "scan_type", "offer_type", "created_at", "risk_level", "risk_score", "scam_category", "preview"]
        read_only_fields = fields
