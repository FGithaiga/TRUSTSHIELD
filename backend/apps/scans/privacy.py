"""Redaction applied before a scan is stored without the user's consent to keep text."""
import copy
import re

PHONE = re.compile(r"((?:\+?254|0)\s?(?:7|1)\d{2})\s?\d{3}\s?(\d{3})")
MAX_EVIDENCE_CHARS = 60


def mask(text):
    text = PHONE.sub(lambda m: f"{m.group(1)} XXX {m.group(2)}", text)
    return text if len(text) <= MAX_EVIDENCE_CHARS else text[: MAX_EVIDENCE_CHARS - 1] + "…"


def redact_findings(findings):
    redacted = copy.deepcopy(findings)
    for f in redacted:
        f["evidence"] = [mask(e) for e in f.get("evidence", [])]
    return redacted
