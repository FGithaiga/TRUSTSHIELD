import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.scans.models import ScanFeedback

COLUMNS = [
    "scan_id", "created_at", "scan_type", "offer_type", "risk_level", "risk_score", "scam_category",
    "model", "model_label", "model_version", "finding_codes", "user_verdict", "user_label", "user_comment", "content",
]


class Command(BaseCommand):
    help = (
        "Export user feedback on results as labelled CSV for the ML workstream. "
        "Message text is included only for users who chose to save the text they check."
    )

    def add_arguments(self, parser):
        parser.add_argument("--out", help="Output path (default: backend/exports/feedback-<date>.csv)")

    def handle(self, *args, out=None, **options):
        path = Path(out) if out else settings.BASE_DIR / "exports" / f"feedback-{timezone.localdate():%Y%m%d}.csv"
        path.parent.mkdir(parents=True, exist_ok=True)
        rows = ScanFeedback.objects.select_related("scan").order_by("scan__created_at")
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(COLUMNS)
            for fb in rows:
                s, model = fb.scan, fb.scan.model_result or {}
                writer.writerow([
                    s.id, s.created_at.isoformat(), s.scan_type, s.offer_type or "", s.risk_level, s.risk_score,
                    s.scam_category, model.get("model", ""), model.get("label", ""), s.model_version,
                    " ".join(f["code"] for f in s.findings), fb.verdict, fb.actual, fb.comment, s.content or "",
                ])
        self.stdout.write(self.style.SUCCESS(f"Exported {rows.count()} labelled results to {path}"))
