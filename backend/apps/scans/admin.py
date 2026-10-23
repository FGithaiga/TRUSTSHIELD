from django.contrib import admin

from .models import Scan, ScanFeedback


@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ["created_at", "user", "scan_type", "risk_level", "risk_score", "scam_category", "model_version"]
    list_filter = ["scan_type", "risk_level", "explanation_source"]
    search_fields = ["user__email", "scam_category", "preview"]
    readonly_fields = [f.name for f in Scan._meta.fields]
    date_hierarchy = "created_at"


@admin.register(ScanFeedback)
class ScanFeedbackAdmin(admin.ModelAdmin):
    list_display = ["scan", "verdict", "actual", "updated_at"]
    list_filter = ["verdict", "actual"]
