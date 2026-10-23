from django.contrib import admin
from django.db.models import Count

from .models import Indicator


@admin.register(Indicator)
class IndicatorAdmin(admin.ModelAdmin):
    list_display = ["masked", "kind", "sighting_count", "report_count", "first_seen"]
    list_filter = ["kind"]
    search_fields = ["masked"]
    readonly_fields = ["kind", "value_hash", "masked", "first_seen"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_s=Count("sightings", distinct=True), _r=Count("report_links", distinct=True))

    @admin.display(description="Users flagged", ordering="_s")
    def sighting_count(self, obj):
        return obj._s

    @admin.display(description="Reports", ordering="_r")
    def report_count(self, obj):
        return obj._r
