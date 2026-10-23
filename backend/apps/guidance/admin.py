from django.contrib import admin

from .models import ReportingResource


@admin.register(ReportingResource)
class ReportingResourceAdmin(admin.ModelAdmin):
    list_display = ["name", "contact", "kind", "order", "is_active", "reviewed_on"]
    list_editable = ["order", "is_active"]
    prepopulated_fields = {"slug": ["name"]}
