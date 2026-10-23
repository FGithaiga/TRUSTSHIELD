from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle

from apps.community import memory
from apps.scans.analysis import indicators

from .models import CommunityReport
from .serializers import CommunityReportSerializer

PUBLIC_STATUSES = [CommunityReport.Status.SYNTHETIC, CommunityReport.Status.VERIFIED]


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunityReportSerializer

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == "POST" else [AllowAny()]

    def get_throttles(self):
        if self.request.method == "POST":
            throttle = ScopedRateThrottle()
            throttle.scope = "report"
            return [throttle]
        return super().get_throttles()

    def get_queryset(self):
        visible = Q(status__in=PUBLIC_STATUSES)
        if self.request.user.is_authenticated:
            # Authors can see their own submissions while they await moderation.
            visible |= Q(submitted_by=self.request.user, status=CommunityReport.Status.PENDING)
        qs = CommunityReport.objects.filter(visible)
        channel = self.request.query_params.get("channel")
        if channel in dict(CommunityReport.Channel.choices):
            qs = qs.filter(channel=channel)
        return qs

    def perform_create(self, serializer):
        involved = serializer.validated_data.pop("involved", "")
        report = serializer.save(submitted_by=self.request.user, status=CommunityReport.Status.PENDING)
        # Counted in community memory only once a moderator makes the report public.
        memory.link_report(report, indicators.extract("mpesa", involved) if involved else [])
