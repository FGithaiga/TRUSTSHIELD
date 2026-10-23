from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.community import memory

from .analysis import engine
from .models import Scan, ScanFeedback
from .privacy import redact_findings
from .serializers import AnalyzeRequestSerializer, FeedbackSerializer, ScanListSerializer, ScanSerializer


class ScanThrottle(ScopedRateThrottle):
    scope = "scan"

    def get_cache_key(self, request, view):
        ident = request.user.pk if request.user.is_authenticated else self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class AnalyzeView(APIView):
    throttle_classes = [ScanThrottle]

    def post(self, request):
        req = AnalyzeRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        data = req.validated_data
        user = request.user
        try:
            result = engine.analyze(
                data["scan_type"], data["content"], data.get("offer_type"),
                community=lambda items: memory.lookup(user, items),
            )
        except engine.AnalysisError as exc:
            return Response({"content": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)
        found_indicators = result.pop("_indicators")

        keep_text = request.user.saves_scan_text
        scan = Scan.objects.create(
            user=request.user,
            **{k: v for k, v in result.items() if k not in {"risk_score_is_heuristic", "findings"}},
            findings=result["findings"] if keep_text else redact_findings(result["findings"]),
            content=data["content"] if keep_text else None,
        )
        # Only risky checks feed community memory; a clear result is not evidence against anyone.
        if scan.risk_level != Scan.RiskLevel.CLEAR:
            memory.record(user, found_indicators)
        # The immediate response carries the full, unredacted findings for highlighting.
        body = ScanSerializer(scan).data
        body["findings"] = result["findings"]
        return Response(body, status=status.HTTP_201_CREATED)


class ScanViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    lookup_value_regex = "[0-9a-f-]{36}"

    def get_queryset(self):
        qs = Scan.objects.filter(user=self.request.user)
        params = self.request.query_params
        if params.get("scan_type") in dict(Scan.ScanType.choices):
            qs = qs.filter(scan_type=params["scan_type"])
        if params.get("risk_level") in dict(Scan.RiskLevel.choices):
            qs = qs.filter(risk_level=params["risk_level"])
        if search := params.get("search", "").strip():
            qs = qs.filter(Q(preview__icontains=search) | Q(scam_category__icontains=search))
        return qs

    def get_serializer_class(self):
        return ScanListSerializer if self.action == "list" else ScanSerializer


class FeedbackView(APIView):
    """Create or update the user's judgement on one of their own results."""

    def put(self, request, pk):
        scan = Scan.objects.filter(pk=pk, user=request.user).first()
        if scan is None:
            return Response({"detail": "Scan not found."}, status=status.HTTP_404_NOT_FOUND)
        instance = ScanFeedback.objects.filter(scan=scan).first()
        serializer = FeedbackSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(scan=scan)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def pulse(request):
    """Anonymous, community-wide trends for the last 7 days compared with the 7 before."""
    cached = cache.get("scam-pulse")
    if cached:
        return Response(cached)
    now = timezone.now()
    this_week = Scan.objects.filter(created_at__gte=now - timedelta(days=7))
    last_week = Scan.objects.filter(created_at__gte=now - timedelta(days=14), created_at__lt=now - timedelta(days=7))
    minimum = settings.PULSE_MIN_GROUP

    def categories(qs):
        rows = (
            qs.exclude(scam_category=engine.NO_CATEGORY).values("scam_category")
            .annotate(count=Count("id"), people=Count("user", distinct=True))
        )
        return {r["scam_category"]: r for r in rows}

    current, previous = categories(this_week), categories(last_week)
    trending = sorted(
        (
            {"category": name, "count": row["count"], "previous": previous.get(name, {}).get("count", 0)}
            for name, row in current.items()
            # Small groups are hidden so a trend can never point to an individual.
            if row["count"] >= minimum and row["people"] >= 2
        ),
        key=lambda r: (-r["count"], r["category"]),
    )[:5]
    total = this_week.count()
    high = this_week.filter(risk_level=Scan.RiskLevel.HIGH).count()
    data = {
        "window_days": 7,
        "enough_data": total >= minimum * 2,
        "checks": total,
        "high_share": round(high / total * 100) if total else 0,
        "trending": trending,
        "by_type": [{"scan_type": t, "count": this_week.filter(scan_type=t).count()} for t in engine.SCAN_TYPES],
        "generated_at": now.isoformat(),
    }
    cache.set("scam-pulse", data, 300)
    return Response(data)


@api_view(["GET"])
def dashboard_summary(request):
    try:
        days = int(request.query_params.get("days", 30))
    except ValueError:
        days = 30
    days = days if days in (7, 30, 90) else 30

    today = timezone.localdate()
    start = today - timedelta(days=days - 1)
    scans = Scan.objects.filter(user=request.user)
    in_range = scans.filter(created_at__date__gte=start)

    per_day = {}
    rows = in_range.annotate(day=TruncDate("created_at")).values("day", "risk_level").annotate(n=Count("id"))
    for row in rows:
        per_day.setdefault(row["day"], {"high": 0, "caution": 0, "clear": 0})[row["risk_level"]] = row["n"]
    by_day = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        counts = per_day.get(day, {"high": 0, "caution": 0, "clear": 0})
        by_day.append({"date": day.isoformat(), **counts})

    levels = dict(in_range.values_list("risk_level").annotate(n=Count("id")))
    types = dict(in_range.values_list("scan_type").annotate(n=Count("id")))
    categories = (
        in_range.exclude(scam_category=engine.NO_CATEGORY)
        .values("scam_category").annotate(count=Count("id")).order_by("-count", "scam_category")[:5]
    )

    return Response({
        "days": days,
        "totals": {
            "scans": sum(levels.values()),
            "high": levels.get("high", 0),
            "caution": levels.get("caution", 0),
            "clear": levels.get("clear", 0),
        },
        "by_day": by_day,
        "by_type": [{"scan_type": t, "count": types.get(t, 0)} for t in engine.SCAN_TYPES],
        "top_categories": [{"category": c["scam_category"], "count": c["count"]} for c in categories],
        "recent": ScanListSerializer(scans[:6], many=True).data,
    })
