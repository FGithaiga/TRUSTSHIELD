from django.conf import settings
from django.db.models import Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ReportingResource


@api_view(["GET"])
@permission_classes([AllowAny])
def guidance(request):
    resources = ReportingResource.objects.filter(is_active=True)
    reviewed = resources.aggregate(latest=Max("reviewed_on"))["latest"]
    return Response({
        "resources": [
            {
                "id": r.slug, "name": r.name, "contact": r.contact, "kind": r.kind,
                "description": r.description, "url": r.url or None,
            }
            for r in resources
        ],
        "verified_on": reviewed.isoformat() if reviewed else settings.GUIDANCE_REVIEWED_ON,
    })
