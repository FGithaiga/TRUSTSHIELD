"""Community memory: has this number or domain been flagged by other people?"""
import hashlib
import hmac
from datetime import timedelta

from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone

from apps.scans.analysis.indicators import WINDOW_DAYS

from .models import Indicator, ReportIndicator, Sighting

PUBLIC_REPORT_STATUSES = ("synthetic", "verified")


def digest(kind, value):
    key = settings.INDICATOR_HASH_KEY.encode()
    return hmac.new(key, f"{kind}:{value}".encode(), hashlib.sha256).hexdigest()


def get_or_create(item):
    obj, _ = Indicator.objects.get_or_create(
        kind=item["kind"], value_hash=digest(item["kind"], item["value"]), defaults={"masked": item["masked"]}
    )
    return obj


def lookup(user, items):
    """Return matches for indicators seen by *other* users or in public reports."""
    if not items:
        return []
    hashes = {digest(i["kind"], i["value"]): i for i in items}
    since = timezone.now() - timedelta(days=WINDOW_DAYS)
    rows = (
        Indicator.objects.filter(value_hash__in=hashes)
        .annotate(
            users=Count("sightings", filter=Q(sightings__last_seen__gte=since) & ~Q(sightings__user=user), distinct=True),
            reports=Count("report_links", filter=Q(report_links__report__status__in=PUBLIC_REPORT_STATUSES), distinct=True),
        )
    )
    matches = []
    for row in rows:
        if row.users or row.reports:
            matches.append({"kind": row.kind, "masked": hashes[row.value_hash]["masked"], "users": row.users, "reports": row.reports})
    return matches


def record(user, items):
    for item in items:
        Sighting.objects.update_or_create(indicator=get_or_create(item), user=user)


def link_report(report, items):
    for item in items:
        ReportIndicator.objects.get_or_create(report=report, indicator=get_or_create(item))
