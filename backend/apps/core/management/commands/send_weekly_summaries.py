from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.scans.models import Scan
from apps.trainer.views import _stats


class Command(BaseCommand):
    help = "Email the weekly safety summary to users who turned it on. Schedule weekly (for example with cron)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Print what would be sent without sending.")

    def handle(self, *args, dry_run=False, **options):
        since = timezone.now() - timedelta(days=7)
        trending = (
            Scan.objects.filter(created_at__gte=since).exclude(scam_category="No category")
            .values_list("scam_category", flat=True)
        )
        counts = {}
        for name in trending:
            counts[name] = counts.get(name, 0) + 1
        top = [name for name, n in sorted(counts.items(), key=lambda kv: -kv[1]) if n >= settings.PULSE_MIN_GROUP][:3]

        sent = 0
        recipients = User.objects.filter(is_active=True, preferences__weekly_summary=True).exclude(email__endswith=".demo.trustshield254.ke")
        for user in recipients:
            mine = user.scans.filter(created_at__gte=since)
            stats = _stats(user)
            lines = [
                f"Habari {user.full_name.split()[0]},",
                "",
                f"This week you ran {mine.count()} check(s); {mine.filter(risk_level='high').count()} were high risk.",
                f"Scam Sense level: {stats['level']} ({stats['answered']} practice messages answered).",
            ]
            if top:
                lines += ["", "Scams most checked on TrustShield this week:"] + [f"- {name}" for name in top]
            lines += ["", "Remember: Safaricom will never ask for your M-PESA PIN.", "", f"Open TrustShield 254: {settings.FRONTEND_URL}/app"]
            if dry_run:
                self.stdout.write(f"--- {user.email}\n" + "\n".join(lines))
            else:
                send_mail("Your weekly TrustShield 254 safety summary", "\n".join(lines), settings.DEFAULT_FROM_EMAIL, [user.email])
            sent += 1
        self.stdout.write(self.style.SUCCESS(f"{'Prepared' if dry_run else 'Sent'} {sent} weekly summaries."))
