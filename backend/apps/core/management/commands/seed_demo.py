import csv
import random
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.community import memory
from apps.reports.models import CommunityReport
from apps.scans.analysis import engine
from apps.scans.analysis import indicators as indicator_extraction
from apps.scans.models import Scan
from apps.scans.privacy import redact_findings

DEMO_EMAIL = "demo@trustshield254.ke"
DEMO_PASSWORD = "Demo@2540"
# Background accounts that give Scam Pulse realistic, multi-person trends in demos. They cannot sign in.
COMMUNITY_DOMAIN = "@community.demo.trustshield254.ke"
COMMUNITY_USERS = ["wanjiku", "otieno", "chebet"]
CSV_PATH = settings.PROJECT_ROOT / "Data" / "community_scam_reports.csv"

# report_type in the CSV -> (channel, category, indicators)
CSV_MAPPING = {
    "Phishing": ("url", "Phishing login link", ["Credential request", "Suspicious link"]),
    "Fake Job": ("offer", "Advance-fee job offer", ["Upfront fee", "Recruiter pressure"]),
    "Fake Online Shop": ("offer", "Prepayment shopping scam", ["Prepayment only", "Seller disappears"]),
    "Mobile Money Scam": ("mpesa", "Prize or promotion scam", ["Prize claim", "Fee to claim"]),
    "Impersonation": ("mpesa", "Impersonation of a trusted organization", ["Impersonation", "Personal details request"]),
}

EXTRA_REPORTS = [
    ("mpesa", "Fake reversal request", "Caller claims to have sent money by mistake and pressures the recipient to send it back to a different number.", "Nairobi", ["Reversal request", "Urgency", "Different callback number"]),
    ("url", "Brand impersonation link", "SMS with a look-alike Safaricom rewards domain asking users to log in to claim bonus points.", "Kisumu", ["Look-alike domain", "Reward claim"]),
    ("offer", "Advance-fee job offer", "Recruitment advert for hotel jobs abroad requiring a medical and visa processing fee before any interview.", "Mombasa", ["Upfront fee", "No interview"]),
    ("mpesa", "PIN or OTP request", "Message pretending to be customer care asks for the M-PESA PIN to prevent account suspension.", "Nakuru", ["PIN request", "Account suspension threat"]),
    ("offer", "Unrealistic investment return", "Group chat promoting a forex scheme promising to double deposits within a week.", "Nyeri", ["Guaranteed returns", "Deadline pressure"]),
]

# Fictional samples, mirrored from the frontend sample chips.
SAMPLES = [
    ("mpesa", None, "Confirmed. You have received Ksh 3,500.00 from JOHN KAMAU 0712 000 111 on 14/10/26 at 9:41 PM. Hello, I have sent this money to you by mistake, please reverse it to 0712 000 111 urgently, my child is in hospital."),
    ("mpesa", None, "SAFARICOM: Your M-PESA account will be suspended within 24 hours. To keep your account active, reply with your M-PESA PIN and the OTP code sent to you now."),
    ("mpesa", None, "CONGRATULATIONS! You have won Ksh 50,000 in the Safaricom Shangwe promotion. To claim your reward, pay a processing fee of Ksh 1,200 to till 000000 then visit http://safaricom-rewards-update.com/claim/now"),
    ("mpesa", None, "Hi Wanjiru, I have just paid the Ksh 1,500 for the books. Let me know when they arrive. Thanks!"),
    ("mpesa", None, "Your parcel has arrived at the Westlands pickup point. Bring your ID to collect it before Friday."),
    ("url", None, "http://safaricom-rewards-update.com/claim/now"),
    ("url", None, "http://197.0.0.12/mpesa/verify-account?id=7781"),
    ("url", None, "https://bit.ly/claim-bonus-ke"),
    ("url", None, "https://www.safaricom.co.ke/personal/m-pesa"),
    ("url", None, "https://mpesa-bonus-ke.xyz/login"),
    ("offer", "job", "URGENT HIRING: Data entry clerks needed, work from home. Earn Ksh 3,000 per day, no experience or interview required. Pay a registration fee of Ksh 500 to secure your slot. Contact HR on WhatsApp only."),
    ("offer", "investment", "Double your money in 7 days! Invest from Ksh 1,000 and receive guaranteed returns of 100%. Limited slots, offer ends tonight. Send to the agent number to join."),
    ("offer", "shopping", "Brand new iPhone for only Ksh 9,999. Pay full amount first via M-PESA and we deliver in 2 hours. Stock is limited, pay now to reserve."),
    ("offer", "job", "We are hiring an Accounts Assistant at our Nairobi office. Applicants should hold a CPA qualification. Shortlisted candidates will be invited for an interview."),
]


class Command(BaseCommand):
    help = "Create the demo account, synthetic threat-feed reports and sample scan history for local development."

    def add_arguments(self, parser):
        parser.add_argument("--scans", type=int, default=45, help="Number of sample scans for the demo user.")
        parser.add_argument("--reset", action="store_true", help="Delete existing demo data first.")

    @transaction.atomic
    def handle(self, *args, scans, reset, **options):
        if reset:
            User.objects.filter(email=DEMO_EMAIL).delete()
            User.objects.filter(email__endswith=COMMUNITY_DOMAIN).delete()
            CommunityReport.objects.filter(status=CommunityReport.Status.SYNTHETIC).delete()

        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL, defaults={"full_name": "Amani Otieno", "phone": "0700000000"}
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.date_joined = timezone.now() - timedelta(days=40)
            user.save()
        self.stdout.write(f"Demo user: {DEMO_EMAIL} / {DEMO_PASSWORD} ({'created' if created else 'exists'})")

        self._seed_reports()
        if created or reset or not user.scans.exists():
            self._seed_scans(user, scans)
        self._seed_community()
        self.stdout.write(self.style.SUCCESS("Demo data ready."))

    def _link_demo_indicator(self):
        # Fingerprints depend on INDICATOR_HASH_KEY, so re-link on every run: this also
        # repairs community memory if the secret key was changed after seeding.
        brand = CommunityReport.objects.filter(status=CommunityReport.Status.SYNTHETIC, category="Brand impersonation link").first()
        if brand:
            memory.link_report(brand, indicator_extraction.extract("url", "http://safaricom-rewards-update.com/claim/now"))

    def _seed_reports(self):
        if CommunityReport.objects.filter(status=CommunityReport.Status.SYNTHETIC).exists():
            self.stdout.write("Synthetic reports already present.")
            self._link_demo_indicator()
            return
        now = timezone.now()
        reports = []
        if CSV_PATH.exists():
            with CSV_PATH.open(newline="", encoding="utf-8") as fh:
                for row in csv.DictReader(fh):
                    if row.get("is_suspicious") != "1" or row["report_type"] not in CSV_MAPPING:
                        continue
                    channel, category, indicators = CSV_MAPPING[row["report_type"]]
                    reports.append(CommunityReport(
                        channel=channel, category=category, summary=row["description"], platform=row["platform"],
                        indicators=indicators, status=CommunityReport.Status.SYNTHETIC, source_ref=row["report_id"],
                    ))
        for channel, category, summary, region, indicators in EXTRA_REPORTS:
            reports.append(CommunityReport(
                channel=channel, category=category, summary=summary, region=region, indicators=indicators,
                status=CommunityReport.Status.SYNTHETIC,
            ))
        created = CommunityReport.objects.bulk_create(reports)
        # The fictional look-alike domain used in the samples, so community memory can be demonstrated.
        self._link_demo_indicator()
        for i, report in enumerate(created):
            CommunityReport.objects.filter(pk=report.pk).update(reported_at=now - timedelta(hours=i * 17 + 3))
        self.stdout.write(f"Created {len(created)} synthetic reports.")

    def _seed_community(self):
        if User.objects.filter(email__endswith=COMMUNITY_DOMAIN).exists():
            return
        for i, name in enumerate(COMMUNITY_USERS):
            member = User(email=f"{name}{COMMUNITY_DOMAIN}", full_name=f"Community demo {name.title()}")
            member.set_unusable_password()
            member.save()
            self._seed_scans(member, 14, seed=300 + i, days=13)
        self.stdout.write(f"Created {len(COMMUNITY_USERS)} community demo accounts for Scam Pulse.")

    def _seed_scans(self, user, count, seed=254, days=30):
        rng = random.Random(seed)
        now = timezone.now()
        user.scans.all().delete()
        for i in range(count):
            scan_type, offer_type, text = rng.choice(SAMPLES)
            result = engine.analyze(scan_type, text, offer_type)
            result.pop("_indicators")
            scan = Scan.objects.create(
                user=user,
                **{k: v for k, v in result.items() if k not in {"risk_score_is_heuristic", "findings"}},
                findings=redact_findings(result["findings"]),
            )
            days_ago = rng.randint(0, days - 1) if i > 5 else 0
            Scan.objects.filter(pk=scan.pk).update(created_at=now - timedelta(days=days_ago, hours=rng.randint(0, 10), minutes=rng.randint(0, 59)))
        self.stdout.write(f"Created {count} sample scans for {user.email}.")
