import datetime

from django.db import migrations

# Review these contacts against official sources before public release; they are editable in the admin.
RESOURCES = [
    ("safaricom-333", "Safaricom fraud SMS reporting", "Forward the SMS to 333", "Report", "Report scam text messages to Safaricom at no cost.", "https://www.safaricom.co.ke"),
    ("safaricom-care", "Safaricom Customer Care", "Call 100 (prepaid) or 200 (postpaid)", "Support", "Ask about a transaction, reversal or SIM issue.", "https://www.safaricom.co.ke"),
    ("dci", "Directorate of Criminal Investigations", "Toll-free 0800 722 203", "Report", "Report fraud and cybercrime to the DCI.", "https://www.dci.go.ke"),
    ("kecirt", "National KE-CIRT/CC", "Report online at ke-cirt.go.ke", "Report", "National cybersecurity incident reporting.", "https://www.ke-cirt.go.ke"),
    ("police", "Emergency police", "Call 999 or 112", "Emergency", "For threats or any situation where you are in danger.", ""),
]


def seed(apps, schema_editor):
    Resource = apps.get_model("guidance", "ReportingResource")
    for order, (slug, name, contact, kind, description, url) in enumerate(RESOURCES):
        Resource.objects.update_or_create(
            slug=slug,
            defaults=dict(name=name, contact=contact, kind=kind, description=description, url=url, order=order,
                          reviewed_on=datetime.date(2026, 10, 23)),
        )


def unseed(apps, schema_editor):
    apps.get_model("guidance", "ReportingResource").objects.filter(slug__in=[r[0] for r in RESOURCES]).delete()


class Migration(migrations.Migration):
    dependencies = [("guidance", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
