from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("scans", views.ScanViewSet, basename="scan")

urlpatterns = [
    path("scans/analyze/", views.AnalyzeView.as_view(), name="scan-analyze"),
    path("scans/<uuid:pk>/feedback/", views.FeedbackView.as_view(), name="scan-feedback"),
    path("dashboard/summary/", views.dashboard_summary, name="dashboard-summary"),
    path("pulse/", views.pulse, name="pulse"),
    *router.urls,
]
