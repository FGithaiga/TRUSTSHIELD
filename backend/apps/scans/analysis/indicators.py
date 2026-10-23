"""Extract phone numbers and domains that can be matched against community memory.

Raw values never leave this process: the community app stores only keyed
hashes, and the API only ever returns masked forms.
"""
import re

from . import url_analyzer
from .rules import HIGH, MEDIUM, PHONE_PATTERN, URL_IN_TEXT_PATTERN, finding

WINDOW_DAYS = 90


def normalize_phone(raw):
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("254"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    return f"254{digits}" if len(digits) == 9 else None


def mask_phone(normalized):
    local = "0" + normalized[3:]
    return f"{local[:4]} XXX {local[-3:]}"


def extract(scan_type, content, url_details=None):
    found = {}
    if scan_type != "url":
        for match in PHONE_PATTERN.finditer(content):
            phone = normalize_phone(match.group(0))
            if phone:
                found[("phone", phone)] = mask_phone(phone)
        links = [m.group(0).rstrip(".,;:!?)") for m in URL_IN_TEXT_PATTERN.finditer(content)]
    else:
        links = [content]
    for link in links[:3]:
        try:
            _, details = url_analyzer.analyze(link)
        except url_analyzer.InvalidURL:
            continue
        # Official domains are never treated as scam indicators.
        if not details["is_official_domain"]:
            found[("domain", details["registered_domain"])] = details["registered_domain"]
    return [{"kind": kind, "value": value, "masked": masked} for (kind, value), masked in found.items()]


def findings_for(matches):
    out = []
    for i, m in enumerate(matches):
        what = "number" if m["kind"] == "phone" else "domain"
        parts = []
        if m["users"]:
            parts.append(f"{m['users']} other {'person' if m['users'] == 1 else 'people'}'s risky checks")
        if m["reports"]:
            parts.append(f"{m['reports']} community report{'s' if m['reports'] != 1 else ''}")
        strong = m["reports"] >= 1 or m["users"] >= 3
        out.append(finding(
            f"community_sighting{'_' + str(i) if i else ''}", HIGH if strong else MEDIUM,
            f"This {what} has been flagged before",
            f"It appeared in {' and '.join(parts)} in the last {WINDOW_DAYS} days.",
            [m["masked"]], "community",
        ))
    return out
