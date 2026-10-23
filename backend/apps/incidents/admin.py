from django.contrib import admin

from .models import Incident


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ["reference", "user", "incident_type", "amount", "channel", "created_at"]
    list_filter = ["incident_type", "channel"]
    search_fields = ["reference", "user__email", "transaction_code"]
