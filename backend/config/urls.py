from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.scans.urls")),
    path("api/", include("apps.guidance.urls")),
    path("api/", include("apps.incidents.urls")),
    path("api/", include("apps.reports.urls")),
    path("api/", include("apps.trainer.urls")),
    # Unknown API routes answer in JSON like the rest of the API, not with an HTML page.
    re_path(r"^api/", lambda request, *args, **kwargs: JsonResponse({"detail": "Not found."}, status=404)),
]

admin.site.site_header = "TrustShield 254 administration"
admin.site.site_title = "TrustShield 254"
