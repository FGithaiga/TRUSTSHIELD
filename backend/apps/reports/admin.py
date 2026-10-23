from django.contrib import admin

from .models import CommunityReport


@admin.register(CommunityReport)
class CommunityReportAdmin(admin.ModelAdmin):
    list_display = ["category", "channel", "region", "status", "submitted_by", "reported_at"]
    list_filter = ["status", "channel"]
    search_fields = ["category", "summary", "region"]
    actions = ["approve", "reject"]

    @admin.action(description="Approve selected reports (publish to the threat feed)")
    def approve(self, request, queryset):
        queryset.update(status=CommunityReport.Status.VERIFIED)

    @admin.action(description="Reject selected reports")
    def reject(self, request, queryset):
        queryset.update(status=CommunityReport.Status.REJECTED)
